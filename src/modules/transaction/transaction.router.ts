import { Router } from "express";
import { TransactionController } from "./transaction.controller";

export class TransactionRouter {
  private router: Router;
  private transactionController: TransactionController;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.post("/", this.transactionController.createTransaction);
  };
  getRouter = () => {
    return this.router;
  };
}
