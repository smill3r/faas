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

  private async queueExecution(req: Request, res: Response) {
    const { image, parameters } = req.body;
    const username = req.headers["x-consumer-username"];
    try {
      if (image && username && typeof username == "string") {
        const result = await this.functionService.queue(
          image,
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
