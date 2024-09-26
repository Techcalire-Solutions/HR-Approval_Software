
import { PerformaInvoiceStatus } from "./performa-invoice-status";
import { User } from "./user";



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

  supplierName: string;
  supplierPoNo: string;
  supplierPrice: string;
  purpose:string;
  customerName: string;
  customerPoNo: string;
  poValue: string;
  count: number;
  addedById: number;
  addedBy: User
}
