import { Controller } from "@cc/faas/interfaces/controller.interface";
import { authMiddleware } from "@cc/faas/middleware/auth.middleware";
import { Request, Response, Router } from "express";
import { FunctionService } from "../services/function.service";
import { NatsServiceType } from "../services/nats.service";

export class FunctionController implements Controller {
  public path = "/function";
  public router = Router();
  private functionService: FunctionService;

  constructor(natsService: NatsServiceType) {
    this.functionService = new FunctionService(natsService);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/invokeFunction`, authMiddleware, (req, res) =>
      this.invokeFunction(req, res)
    );
    this.router.post(`${this.path}/register`, authMiddleware, (req, res) =>
      this.registerFunction(req, res)
    );
    this.router.get(`${this.path}/`, authMiddleware, (req, res) =>
      this.getUserFunctions(req, res)
    );
  }


  private async getUserFunctions(req: Request, res: Response) {
    const username = req.headers["x-consumer-username"] as string;
    if (username) {
      try {
        const functions = await this.functionService.getUserFunctions(username);
        res.status(200).json(functions);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(400).send("Missing username in your request");
    }
  }


  private registerFunction(req: Request, res: Response) {
    const { name, image, description } = req.body;
    const username = req.headers["x-consumer-username"] as string;
    if (image && name && description && username) {
      try {
        this.functionService.register(name, image, description, username);
        res.status(200).send("Function registered successfully");
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(400).send("Missing data in your request");
    }
  }

  private async invokeFunction(req: Request, res: Response) {
    const { functionName, parameters } = req.body;
    const username = req.headers["x-consumer-username"];
    try {
      if (functionName && username && typeof username == "string") {
        const result = await this.functionService.executeFunction(
          functionName,
          parameters,
          username
        );
        res.status(200).json(result);
      } else {
        throw new Error(
          "Missing data in your request, make sure to include the function name and parameters"
        );
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
