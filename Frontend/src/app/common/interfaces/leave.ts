import { LeaveType } from "./leaveType";
import { User } from "./user";

export interface Leave{
  id:number;
  leaveTypeId: number;
  leaveType: LeaveType
  startDate: Date;
  endDate: Date;
  notes: string
  userId: number
  user: User
}
