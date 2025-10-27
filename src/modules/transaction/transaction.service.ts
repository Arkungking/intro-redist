import { TransactionStatus } from "../../generated/prisma";
import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { TransactionQueue } from "./transaction.queue";

export class TransactionService {
  private prisma: PrismaService;
  private transactioQueue: TransactionQueue;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.transactioQueue = new TransactionQueue();
    this.cloudinaryService = new CloudinaryService();
  }

  createTransaction = async (
    body: CreateTransactionDTO,
    authUserId: number
  ) => {
    // 1. get all tickets IDs from body.payload
    const payload = body.payload; // ----> [{ ticketId: 1, qty: 1 }, { ticketId: 2, qty: 2 }]
    const ticketIds = payload.map((item) => item.ticketId); // ----> [1,2]

    // 2. fetch all tickets from DB based on ticket IDs
    const tickets = await this.prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
    });

    // 3. validate tickets availabilty
    for (const item of payload) {
      const ticket = tickets.find((ticket) => ticket.id === item.ticketId);

      if (!ticket) {
        throw new ApiError(`ticket with id ${item.ticketId} not found`, 400);
      }

      if (ticket.stock < item.qty) {
        throw new ApiError("insufficient stock", 400);
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 4. create data transaction
      const transaction = await tx.transaction.create({
        data: { userId: authUserId },
      });
      // 5. create data transaction detail
      const transactionDetails = payload.map((item) => {
        const ticket = tickets.find((ticket) => ticket.id === item.ticketId)!;

        return {
          transactionId: transaction.id,
          ticketId: ticket.id,
          qty: item.qty,
          price: ticket.price,
        };
      });

      await tx.transactionDetail.createMany({
        data: transactionDetails,
      });
      // 6. decrement stock for each ticket based on user qty
      for (const item of payload) {
        await tx.ticket.update({
          where: { id: item.ticketId },
          data: { stock: { decrement: item.qty } },
        });
      }

      return transaction;
    });

    // 7. TODO: send email for user to upload payment proof
    // 8. buat dealy queue
    await this.transactioQueue.addNewTransaction(result.uuid);

    return { message: "create transcation success" };
  };

  uploadPaymentProof = async (
    uuid: string,
    paymentproof: Express.Multer.File,
    authUserId: number
  ) => {
    // cari dulu transaksi berdasarkan uuid
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid },
    });
    // kalo ngga ada throw error
    if (!transaction) {
      throw new ApiError("Invalid transaction uuid", 400);
    }
    // kalo ada cek juga userId di data transaksi, apakah sama dengan authUserId dari sisi token
    // kalo tidak sama throw error
    if (transaction.userId !== authUserId) {
      throw new ApiError("Forbidden", 403);
    }

    const allowedStatus: TransactionStatus[] = [
      "WAITING_FOR_CONFIRMATION",
      "WAITING_FOR_PAYMENT",
    ];

    if (!allowedStatus.includes(transaction.status)) {
      throw new ApiError("Invalid transaction status", 400);
    }
    // kalo udah ada paymentProof sebelumnya, dihapus dulu
    if (transaction.paymentProof) {
      await this.cloudinaryService.remove(transaction.paymentProof)
    }
    // upload paymenProof ke cloudinary
    const { secure_url } = await this.cloudinaryService.upload(paymentproof);
    // update data status transaksi menjadi WAITING_FOR CONFIRMATION & isi kolom payment proof dengan secure_url dari cloudinary
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "WAITING_FOR_CONFIRMATION", paymentProof: secure_url },
    });
  };

  acceptTransaction = async () => {};
  rejectTransaction = async () => {};
}
