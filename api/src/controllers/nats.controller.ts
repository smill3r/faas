import { Request, Response, Router } from "express";
import { NatsServiceType } from "../services/nats.service";

class NatsController {
  private natsService: NatsServiceType;
  public path = "/function";
  public router = Router();

  constructor(natsService: NatsServiceType) {
    this.natsService = natsService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/publish", (req, res) => this.publishMessage(req, res));
  }

  async publishMessage(req: Request, res: Response) {
    const { message, subject } = req.body;

    if (!message || !subject) {
      res
        .status(400)
        .json({ message: "A message and a subject are required to publish" });
    }

    try {
      const acknowledment = await this.natsService.publishMessage(
        message,
        subject
      );
      res.status(200).json({
        success: true,
        message: "Message published",
        details: acknowledment,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error });
    }
  }
}

export default NatsController;
