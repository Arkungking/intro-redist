import express, { Express } from "express";
import { errorMiddleware } from "./middlewares/error.middleware";
import cors from "cors";
import { SampleRouter } from "./modules/sample/sample.router";
import { PORT } from "./config/env";
import { initScheduler } from "./script";
import { TransactionRouter } from "./modules/transaction/transaction.router";

export class App {
  app: Express;

  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
    initScheduler()
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    const transactionRouter = new TransactionRouter();

    this.app.use("/samples", sampleRouter.getRouter());
    this.app.use("/transaction", transactionRouter.getRouter());
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
