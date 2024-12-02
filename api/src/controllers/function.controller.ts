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
    this.router.post(`${this.path}/run`, authMiddleware, (req, res) =>
      this.runFunction(req, res)
    );
    this.router.post(`${this.path}/queue`, authMiddleware, (req, res) =>
      this.queueExecution(req, res)
    );
  }

  private getFunction = async (
    request: RequestWithUser,
    response: Response,
    next: NextFunction
  ) => {
    const id = request.params.id;
    const userFunctionQuery = functionModel.findById(id);
    const userFunction = await userFunctionQuery;
    if (userFunction) {
      response.send(userFunction);
    } else {
      next(new FunctionNotFoundException());
    }
  };

  private async runFunction(req: Request, res: Response) {
    const { image, parameters } = req.body;

    try {
      const output = await this.functionService.run(image, parameters);
      res.status(200).json({ output });
    } catch (err) {
      res.status(500).json({ err });
    }
  }

  private async queueExecution(req: Request, res: Response) {
    const { image, parameters } = req.body;
    try {
      const result = await this.functionService.queue(image, parameters);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json(err);
    }
  }
}
