import { User } from "../users/user";


export interface MonthlyPayroll {
  id: number
  userId: number
  basic: number
  hra: number
  conveyanceAllowance: number
  lta: number
  specialAllowance: number
  ot: number
  incentive: number
  payOut: number
  pfDeduction: number
  esi: number
  tds: number
  advanceAmount: number
  leaveDays: number
  leaveDeduction: number
  incentiveDeduction: number

  toPay: number
  payedFor: string
  payedAt: Date

  user: User

  leaveEncashmentAmount: number
  leaveEncashment: number
  }
