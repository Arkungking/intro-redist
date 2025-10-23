import { TransactionWorker } from "../modules/transaction/transaction.worker"

export const initWorkers = () => {
    //export other workers here
    new TransactionWorker
}