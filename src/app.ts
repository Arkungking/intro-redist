import express, { Express } from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import cors from "cors";
import { SampleRouter } from "./modules/sample/sample.router";
import { PORT } from "./config/env";
import { initScheduler } from "./script";
import { TransactionRouter } from "./modules/transaction/transaction.router";
import { AuthRouter } from "./modules/auth/auth.router";
import { initWorkers } from "./workers";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
    initScheduler();
    initWorkers();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    const transactionRouter = new TransactionRouter();
    const authRouter = new AuthRouter();

    this.app.use("/samples", sampleRouter.getRouter());
    this.app.use("/transactions", transactionRouter.getRouter());
    this.app.use("/auth", authRouter.getRouter());
  }

  private handleError() {
    this.app.use(errorMiddleware);
  }

  public start() {
    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}
