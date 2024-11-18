import { User } from "../users/user";


export interface MonthlyPayroll {
    id: number;
    userId: number,
    basic: number,
    hra: number,
    conveyanceAllowance: number,
    lta: number,
    specialAllowance: number,
    grossSalary: number,
    pf: number,
    insurance: number,
    gratuity: number,
    employeeContribution: number,
    leaveDays: number,

    user: User
  }
  