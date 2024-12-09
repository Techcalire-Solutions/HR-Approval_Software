import { User } from "../users/user";


//basic initial structure of employee
export interface Payroll {
  id: number;
  userId: number,
  basic: number,
  hra: number,
  conveyanceAllowance: number,
  lta: number,
  specialAllowance: number,
  grossPay: number,
  pf: number,
  insurance: number,
  gratuity: number,
  netPay: number,
  user: User
  pfDeduction: number,
  esi: number
}
