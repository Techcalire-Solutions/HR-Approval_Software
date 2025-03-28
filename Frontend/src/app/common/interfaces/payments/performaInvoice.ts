
import { Company } from "../company";
import { User } from "../users/user";
import { PerformaInvoiceStatus } from "./performa-invoice-status";

export interface PerformaInvoice {
  id: number;
  piNo: string;
  url: string;
  status: string;
  bankSlip: string;
  performaInvoiceStatuses: PerformaInvoiceStatus[];
  salesPersonId : number;
  kamId? : number;
  amId?: number;
  accountantId? : number;
  salesPerson: User;
  kam: User;
  am: User;
  accountant: User;


  supplierSoNo: string;
  supplierPoNo: string;
  supplierCurrency: string;
  supplierPrice: string;
  purpose:string;

  customerPoNo: string;
  customerSoNo: string;
  customerCurrency: string;
  poValue: string;
  notes: string;
  paymentMode:string;
  count: number;
  addedById: number;
  addedBy: User;


  supplierId: number;
  customerId?: number;
  suppliers: Company;
  customers: Company

}
