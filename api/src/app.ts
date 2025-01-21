import { AuthController } from "@cc/faas/controllers/auth.controller";
import { FunctionController } from "@cc/faas/controllers/function.controller";
import { UserController } from "@cc/faas/controllers/user.controller";
import { Controller } from "@cc/faas/interfaces/controller.interface";
import express, { Application } from "express";
import * as mongoose from "mongoose";
import natsService from "./services/nats.service"; // Servicio NATS
import NatsController from "./controllers/nats.controller";

// Puerto del servidor
const PORT = process.env.PORT || 3000;

// Crear instancia de Express
const app: Application = express();
app.use(express.json()); // Middleware para procesar JSON

// Variables de entorno para MongoDB
const { MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASSWORD, MONGO_PATH } =
  process.env;

mongoose
  .connect(
    `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_PATH}?authSource=admin`
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Salir si no se puede conectar
  });

const controllers: Controller[] = [
  new UserController(), // Controlador de usuarios
  new AuthController(), // Controlador de autenticación
  new FunctionController(natsService), // Controlador de funciones
  new NatsController(natsService), // Controlador de NATS
];

controllers.forEach((controller) => {
  app.use("/api", controller.router); 
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
