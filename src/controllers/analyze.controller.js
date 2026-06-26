import reasoningService from "../services/reasoning.service.js";

export const analyzeTicket = async (req, res, next) => {
    try {
        const result = await reasoningService(req.body);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};