import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import analyzeRoutes from "./routes/analyze.routes.js";
import healthRoutes from "./routes/health.routes.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();


app.use(helmet());

app.use(cors());

app.use(express.json({ limit: "1mb" }));

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        project: "TransGuard API",
        message: "API is running."
    });
});

app.use("/health", healthRoutes);
app.use("/analyze-ticket", analyzeRoutes);

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Malformed JSON."
        });
    }

    return next(err);
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

app.use(errorHandler);

export default app;
