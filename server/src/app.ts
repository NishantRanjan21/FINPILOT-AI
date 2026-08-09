import express from "express";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorMiddleware";
import healthRoutes from "./routes/healthRoutes";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use("/api/health", healthRoutes);

// Phase 17:
// In production, Express will serve the compiled React frontend
// from client/dist and use a catch-all route for React Router.

app.use(errorHandler);

export default app;