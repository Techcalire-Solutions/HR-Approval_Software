import { User } from "../models/user.model";
import { PerformaInvoiceStatus } from "./performa-invoice-status";



export interface PerformaInvoice {
  id: number;
  piNo: string;
  url: string;
  status: string;
  bankSlip: string;
  performaInvoiceStatuses: PerformaInvoiceStatus[];
  salesPersonId : number;
  kamId : number;
  amId: number;
  accountantId : number;
  salesPerson: User;
  kam: User;
  am: User;
  accountant: User;
}
