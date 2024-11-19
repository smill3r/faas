# FAAS Project Guide
This is a little guide on the FAAS project configuration and development setup. It will act temporarily as a guide for the team to indicate any steps needed to configure the project for development and to build it, but it will be edited before delivering the final version to reflect only needed details.

## Build
How to build this project?

## SSL Certificates

To be able to use HTTPS to communicate through the reverse proxy, you need to setup certificates first. 
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

### With Docker

The project is currently using Docker to build images and deploy containers based on those images, so make sure you have installed and running the [Docker](https://docs.docker.com) daemon on your computer. 

To run a compiled version of the project go to the root folder of the project and use the following command:

```
docker compose up
```

This will compile and execute the project, but it will not reload on any changes, use it when you want to perform tests on integration or performance. 

If you want to run a development version, which will refresh after you save your changes in the code, run:

```
docker compose -f docker-compose.dev.yml up
```

However, take into account that if you make any significant changes (like adding new services or components to the project) you might need to edit the docker-compose.dev.yml file, and the same goes for the build mode. 

### Build each component
You might want to build a component by it's own in order to test or build things isolated from other services. If you want to do that, here's how for each component.

#### HTTP Server
To run the Node.js Server, just make sure to have installed the [Node](https://nodejs.org/en) runtime environment on your computer. I recommend using [Node Version Manager](https://github.com/nvm-sh/nvm) for this to avoid any versioning issues, make sure you are using the correct version specified on the project files. 

To install dependencies:

```
npm install
```

To compile and run:

```
npm run start
```

To run a development build (with nodemon):

```
npm run dev
```

