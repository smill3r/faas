import { FunctionNotFoundException } from "@cc/faas/exceptions/FunctionException";
import { Controller } from "@cc/faas/interfaces/controller.interface";
import { RequestWithUser } from "@cc/faas/interfaces/requestWithUser.interface";
import { authMiddleware } from "@cc/faas/middleware/auth.middleware";
import { functionModel } from "@cc/faas/models/function.model";
import { NextFunction, Request, Response, Router } from "express";
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
    this.router.get(`${this.path}/:id`, authMiddleware, this.getFunction);
    this.router.post(`${this.path}/register`, authMiddleware, this.registerFunction);
    this.router.delete(`${this.path}/:id`, authMiddleware, this.deregisterFunction);
    this.router.post(`${this.path}/queue`, authMiddleware, this.queueExecution);
  }

  // Get a function by ID
  private getFunction = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = request.params.id;
    const username = request.user?.username;

    try {
      const userFunction = await functionModel.findOne({ _id: id, username });
      if (userFunction) {
        response.send(userFunction);
      } else {
        next(new FunctionNotFoundException());
      }
    } catch (err) {
      next(err);
    }
  };

  // Register a new function
  private registerFunction = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { name, dockerImage } = req.body;
    const username = req.user?.username;

    if (!name || !dockerImage || !username) {
      res.status(400).json({ error: "Missing parameters: name or dockerImage." });
      return;
    }

    try {
      const newFunction = new functionModel({
        _id: `${username}-${name}`, 
        name,
        username,
        dockerImage,
        createdAt: new Date(),
      });

      await newFunction.save();

      res.status(201).json({
        message: "Function registered successfully.",
        function: newFunction,
      });
    } catch (err) {
      next(err);
    }
  };

  // Deregister a function
  private deregisterFunction = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const id = req.params.id;
    const username = req.user?.username; // Authenticated user's username

    try {
      const userFunction = await functionModel.findOneAndDelete({ _id: id, username });
      if (userFunction) {
        res.status(200).json({ message: "Function deregistered successfully." });
      } else {
        res.status(404).json({ error: "Function not found or you don't have permissions to delete it." });
      }
    } catch (err) {
      next(err);
    }
  };

  // Queue a function for execution
  private queueExecution = async (
    req: RequestWithUser,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { image, parameters } = req.body;
    const username = req.user?.username;

    if (!image || !username) {
      res.status(400).json({
        error: "Missing parameters. Make sure to include the function name and parameters.",
      });
      return;
    }

    try {
      const result = await this.functionService.queue(image, parameters, username);
      res.status(200).json(result);
    } catch (err: any) {
      next(err);
    }
  };
}
