import { Router } from "express";
import { analyzeTicket } from "../controllers/analyze.controller.js";
import { analyzeTicketValidator } from "../validators/analyze.validator.js";
import validate from "../middleware/validate.middleware.js";

const router = Router();

router.post("/", analyzeTicketValidator, validate, analyzeTicket);

export default router;