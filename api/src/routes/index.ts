import { Router } from "express";
import {
  registerFunction,
  listFunctions,
  getFunction,
  deleteFunction,
  invokeSync,
  invokeAsync,
  getJob,
} from "../controllers/function.controller";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ service: "faas-api", status: "ok", instance: process.env.ID ?? "local" });
});

router.post("/functions", registerFunction);
router.get("/functions", listFunctions);
router.get("/functions/:name", getFunction);
router.delete("/functions/:name", deleteFunction);
router.post("/functions/:name/invoke", invokeSync);
router.post("/functions/:name/invoke/async", invokeAsync);

router.get("/jobs/:jobId", getJob);

export default router;
