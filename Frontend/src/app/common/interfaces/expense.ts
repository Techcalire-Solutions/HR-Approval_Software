import { ExpenseStatus } from "./expense-status"
import { User } from "./user"

export interface Expense {
    id: number
    piNo: string
    exNo : string
    url: string
    bankSlip : string
    status: string
    count: number
    notes:  string
    expenseType: string

    userId: number
    amId: number
    accountantId : number

    user: User
    manager: User
    ma: User

    expenseStatuses: ExpenseStatus[];
}
