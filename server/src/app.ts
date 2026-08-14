import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorMiddleware";
import healthRoutes from "./routes/healthRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);

// Phase 17:
// In production, Express will serve the compiled React frontend
// from client/dist and use a catch-all route for React Router.

app.use(errorHandler);

export default app;