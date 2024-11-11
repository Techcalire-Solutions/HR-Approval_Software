import { User } from "./user";



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

    user: User
  }
  