import { Router } from "express";
import { TransactionController } from "./transaction.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { JWT_SECRET } from "../../config/env";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { validate } from "class-validator";
import { UplaodPaymentProofDTO } from "./dto/upload-payment-proof.dto";
import { validateBody } from "../../middlewares/validation.middleware";

export class TransactionRouter {
  private router: Router;
  private transactionController: TransactionController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }

  private initializedRoutes = () => {
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["USER"]),
      this.transactionController.createTransaction
    );

    this.router.patch(
      "/payment-proof",
      this.jwtMiddleware.verifyToken(JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["USER"]),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "paymentProof", maxCount: 1 }]),
      this.uploaderMiddleware.fileFIlter([
        "image/jpeg",
        "image/png",
        "image/heic",
      ]),
      validateBody(UplaodPaymentProofDTO),
      this.transactionController.uplaodPaymentProof
    );
  };
  getRouter = () => {
    return this.router;
  };
}
