import app from "./app";
import { env } from "./config/env";
import { checkDatabaseConnection } from "./config/database";

const startServer = async (): Promise<void> => {
  try {
    await checkDatabaseConnection();

    app.listen(env.port, () => {
      console.log(
        `FinPilot API running on http://localhost:${env.port}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();