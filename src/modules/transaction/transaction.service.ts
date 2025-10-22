import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";

export class TransactionService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
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

    return { message: "create transcation success" };
  };
}
