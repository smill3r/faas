import express from "express";
const fs = require("fs");
const https = require("https");

const app = express();
const port = process.env.port || 3000;

const options = {
  key: fs.readFileSync("./certificates/key.pem"),
  cert: fs.readFileSync("./certificates/cert.pem"),
};

app.get("/", (req, res) => {
  res.send("Hello, TypeScript Node Express!");
});

https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS server running on https://localhost:${port}`);
});
