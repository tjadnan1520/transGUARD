import { body } from "express-validator";
import Language from "../enums/language.js";
import {
    MAX_COMPLAINT_LENGTH,
    MAX_TRANSACTION_HISTORY
} from "../utils/constants.js";

const CHANNELS = ["in_app_chat", "call_center", "email", "merchant_portal", "field_agent"];
const USER_TYPES = ["customer", "merchant", "agent", "unknown"];

export const analyzeTicketValidator = [
    body("ticket_id")
        .exists()
        .withMessage("ticket_id is required.")
        .bail()
        .isString()
        .withMessage("ticket_id must be a string.")
        .bail()
        .notEmpty()
        .withMessage("ticket_id cannot be empty."),

    body("complaint")
        .exists()
        .withMessage("complaint is required.")
        .bail()
        .isString()
        .withMessage("complaint must be a string.")
        .bail()
        .notEmpty()
        .withMessage("complaint cannot be empty.")
        .bail()
        .isLength({ max: MAX_COMPLAINT_LENGTH })
        .withMessage(`complaint must be at most ${MAX_COMPLAINT_LENGTH} characters.`),

    body("language")
        .optional()
        .isIn(Object.values(Language))
        .withMessage("Invalid language."),

    body("channel")
        .optional()
        .isIn(CHANNELS)
        .withMessage("Invalid channel."),

    body("user_type")
        .optional()
        .isIn(USER_TYPES)
        .withMessage("Invalid user_type."),

    body("campaign_context")
        .optional()
        .isString(),

    body("transaction_history")
        .optional()
        .isArray()
        .withMessage("transaction_history must be an array.")
        .bail()
        .isArray({ max: MAX_TRANSACTION_HISTORY })
        .withMessage(`transaction_history can contain at most ${MAX_TRANSACTION_HISTORY} items.`),

    body("transaction_history.*")
        .optional()
        .isObject()
        .withMessage("Each transaction must be an object."),

    body("metadata")
        .optional()
        .isObject()
        .withMessage("metadata must be an object.")
];
