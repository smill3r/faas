import { AuthController } from "@cc/faas/controllers/auth.controller";
import { FunctionController } from "@cc/faas/controllers/function.controller";
import { UserController } from "@cc/faas/controllers/user.controller";
import { Controller } from "@cc/faas/interfaces/controller.interface";
import express, { Application } from "express";
import * as mongoose from "mongoose";
import natsService from "./services/nats.service";
import NatsController from "./controllers/nats.controller";

const PORT = process.env.PORT || 3000;
const app: Application = express();
app.use(express.json());

const { MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASSWORD, MONGO_PATH } =
  process.env;
mongoose.connect(
  `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_PATH}?authSource=admin`
);

const controllers: Controller[] = [
  new UserController(),
  new AuthController(),
  new FunctionController(natsService),
  new NatsController(natsService)
];
controllers.forEach((controller) => {
  app.use("/api", controller.router);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
