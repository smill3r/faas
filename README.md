# FaaS Platform

[![CI](https://github.com/smill3r/faas/actions/workflows/ci.yml/badge.svg)](https://github.com/smill3r/faas/actions/workflows/ci.yml)

A lightweight Function-as-a-Service platform built on [Apache APISIX](https://apisix.apache.org/) and Node.js. Submit JavaScript functions via a REST API, invoke them synchronously or asynchronously, and watch live traffic metrics in Grafana.

To be able to use HTTPS to communicate through the reverse proxy, you need to set up certificates first. 
There is a file called init.sh that will generate certificates and export the certificates to a .env file so that they can be loaded into the appropriate configuration file in the /apisix directory.

First run:

```
chmod +x init.sh
```

Then:

```
./init.sh
```

If you skip this step, you won't be able to use https to make requests through the reverse proxy, but you can just make regular http requests to the 9080 port.

> Skip this step to use plain HTTP on port `9080` — APISIX still starts but without TLS.

### 2. Run with Docker Compose

**Production build:**

```bash
docker compose up
```

**Development build** (hot reload on API changes):

```bash
docker compose -f docker-compose.dev.yml up
```

### 3. Try the API

```bash
# Health check (no key required)
curl http://localhost:9080/api/

# Register a function
curl -X POST http://localhost:9080/api/functions \
  -H "apikey: demo-key-changeme" \
  -H "Content-Type: application/json" \
  -d '{"name": "greet", "code": "return \"Hello, \" + args.name + \"!\";"}'

# Invoke it synchronously
curl -X POST http://localhost:9080/api/functions/greet/invoke \
  -H "apikey: demo-key-changeme" \
  -H "Content-Type: application/json" \
  -d '{"args": {"name": "World"}}'

# Invoke asynchronously (dispatched via NATS)
curl -X POST http://localhost:9080/api/functions/greet/invoke/async \
  -H "apikey: demo-key-changeme" \
  -H "Content-Type: application/json" \
  -d '{"args": {"name": "World"}}'
# → {"jobId": "..."}

# Poll the result
curl http://localhost:9080/api/jobs/<jobId> \
  -H "apikey: demo-key-changeme"
```

## Monitoring

After `docker compose up`, open:

- **Grafana**: [http://localhost:3000](http://localhost:3000) (no login required)
- **Prometheus**: [http://localhost:9090](http://localhost:9090)
- **Raw metrics**: [http://localhost:9091/apisix/prometheus/metrics](http://localhost:9091/apisix/prometheus/metrics)
- **NATS monitoring**: [http://localhost:8222](http://localhost:8222)

Grafana comes pre-configured with the Prometheus datasource. To import the official APISIX dashboard, go to **Dashboards → Import** and enter ID `11719`.

## Gateway plugins

| Plugin | Route | Effect |
|---|---|---|
| `key-auth` | `/api/*` | Requires `apikey` header; rejects with 401 otherwise |
| `limit-req` | `/api/*` | 10 req/sec per consumer, burst of 20; rejects with 429 when exceeded |
| `prometheus` | all routes | Collects request count, latency, and status code metrics |
| active health checks | upstream | Removes unhealthy backend instances from rotation automatically |

## Project structure

```
faas/
├── api/                          # Node.js / TypeScript backend
│   ├── src/
│   │   ├── app.ts                # Express entry point
│   │   ├── config/nats.ts        # NATS connection + stream constants
│   │   ├── models/function.ts    # Shared types
│   │   ├── services/
│   │   │   ├── nats.service.ts   # NATS KV + JetStream wrapper
│   │   │   └── function.service.ts  # Registry CRUD + invocation logic
│   │   ├── controllers/
│   │   │   └── function.controller.ts
│   │   └── routes/index.ts
│   ├── Dockerfile                # Multi-stage production image
│   └── Dockerfile.dev            # Development image (nodemon)
├── runner/                       # Async job executor
│   └── src/index.ts              # NATS consumer → vm sandbox → KV result
├── apisix/conf/apisix.yaml       # Gateway: routes, plugins, consumers, upstream
├── monitoring/
│   ├── prometheus.yml            # Scrape config
│   └── grafana/provisioning/     # Auto-configured datasource
├── docker-compose.yml            # Full production stack
├── docker-compose.dev.yml        # Development stack (hot reload)
└── generate-cert.sh              # TLS certificate generator
```

## Tech stack

| Layer | Technology |
|---|---|
| API Gateway | Apache APISIX 3.11 — key-auth, rate limiting, Prometheus |
| Messaging | NATS JetStream — async invocation queue + KV store |
| Backend | Node.js 18 · TypeScript · Express |
| Function execution | Node.js `vm` module (sandboxed, 3s timeout) |
| Observability | Prometheus + Grafana |
| Orchestration | Docker Compose |
| TLS | OpenSSL (self-signed, localhost) |

## Running the API server standalone

```bash
cd api
npm install
npm run start   # compile TypeScript and run
npm run dev     # live reload with nodemon
```

To compile and run:

```
npm run start
```

To run a development build (with nodemon):

```
npm run dev
```

## About APISIX

This project sets up Apache APISIX in etcd-based mode using Docker to act as an API gateway for a Node.js API server. 
The setup is designed to handle authentication, manage API traffic, and ensure secure communication with SSL. 
The configuration of services, upstreams, routes, and SSL certificates is defined declaratively in ADC files.

### Initial Configuration

APISIX and ETCD configurations are defined in the config.yaml file, which contains the core settings for APISIX and ETCD integration.

Additionally, APISIX service uses two ADC configuration files:
- adc.yaml: Defines services, upstreams, and routes for handling API requests.
- adc-ssl.yaml: Configures SSL certificates to enable HTTPS communication.

These files are processed by the ADC tool to apply configurations directly to APISIX.

### Authentication Management

Apache APISIX will handle authentication using the Basic Auth plugin. 
This allows users to securely access protected resources after registering via an unprotected route.

#### Unprotected Route for Registration:

Users can register by sending a POST request to an unprotected route provided by the Node.js API server, which is proxied through APISIX:
```
POST https://localhost:9443/api/auth/register
```

The payload for registration includes a username and password:
```
{
    "username": "john",
    "password": "password"
}
```

On successful registration, the Node.js API server creates a new APISIX consumer via the APISIX Admin API.
Then users can access protected routes by including their Basic Auth credentials (username and password) in the request header.
```
GET https://localhost:9443/api/user/me
```
