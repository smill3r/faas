import { Controller } from "@cc/faas/interfaces/controller.interface";
import { authMiddleware } from "@cc/faas/middleware/auth.middleware";
import { Request, Response, Router } from "express";
import functionService, { FunctionService } from "../services/function.service";
import natsService, { NatsServiceType } from "../services/nats.service";

export class FunctionController implements Controller {
  public path = "/function";
  public router = Router();
  private svc: FunctionService;

  constructor(_natsService: NatsServiceType) {
    this.svc = functionService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/register`, authMiddleware, (req, res) =>
      this.registerFunction(req, res)
    );
    this.router.get(`${this.path}/`, authMiddleware, (req, res) =>
      this.listFunctions(req, res)
    );
    this.router.post(`${this.path}/invoke/:name`, authMiddleware, (req, res) =>
      this.invokeFunction(req, res)
    );
  }

  private async registerFunction(req: Request, res: Response) {
    const { name, code } = req.body;
    try {
      const fn = await this.svc.register(name, code);
      res.status(201).json(fn);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  private async listFunctions(_req: Request, res: Response) {
    try {
      const fns = await this.svc.list();
      res.status(200).json(fns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  private async invokeFunction(req: Request, res: Response) {
    try {
      const result = await this.svc.invokeSync(req.params.name, req.body ?? {});
      res.status(200).json({ result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const registerFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code } = req.body;
    const fn = await functionService.register(name, code);
    res.status(201).json(fn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listFunctions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const fns = await functionService.list();
    res.status(200).json(fns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    const fn = await functionService.get(req.params.name);
    res.status(200).json(fn);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const deleteFunction = async (req: Request, res: Response): Promise<void> => {
  try {
    await functionService.remove(req.params.name);
    res.status(204).send();
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const invokeSync = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await functionService.invokeSync(req.params.name, req.body ?? {});
    res.status(200).json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const invokeAsync = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = await functionService.invokeAsync(req.params.name, req.body ?? {});
    res.status(202).json({ jobId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await natsService.getJobResult(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }
    res.status(200).json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
