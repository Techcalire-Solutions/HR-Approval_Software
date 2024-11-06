import { User } from "./user";

export interface AdvanceSalary {
    id: number;
    userId: number,
    scheme:  string,
    amount: number,
    reason:  string,
    createdAt: Date
    updatedAt: Date,
    user: User
    duration: number
  }
  