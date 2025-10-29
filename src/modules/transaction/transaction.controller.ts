import { Request, Response } from "express";
import { TransactionService } from "./transaction.service";
import { ApiError } from "../../utils/api-error";
import { plainToInstance } from "class-transformer";
import { GetTransactionDTO } from "./dto/get-transaction.dto";

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  createTransaction = async (req: Request, res: Response) => {
    const body = req.body;
    const authUserId = Number(res.locals.user.id);
    const result = await this.transactionService.createTransaction(
      body,
      authUserId
    );
    res.status(200).send(result);
  };

  uplaodPaymentProof = async (req: Request, res: Response) => {
    const uuid = req.body.uuid;
    const file = req.files as { [fieldname: string]: Express.Multer.File[] };
    const paymentProof = file.paymentProof?.[0];
    if (!paymentProof) throw new ApiError("paymentProof is required", 400);
    const authUserId = Number(res.locals.user.id);
    const result = await this.transactionService.uploadPaymentProof(
      uuid,
      paymentProof,
      authUserId
    );
    res.status(200).send(result);
  };

  getTransactions = async (req: Request, res: Response) => {
    const query = plainToInstance(GetTransactionDTO, req.query);
    const authUserId = Number(res.locals.user.id);
    const result = await this.transactionService.getTransactions(
      query,
      authUserId
    );
    res.status(200).send(result);
  };
}
