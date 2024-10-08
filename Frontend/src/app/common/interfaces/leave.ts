import { LeaveType } from "./leaveType";

export interface Leave{
  id:number;
  // leaveTypeId: number;
  // leaveType: LeaveType
  startDate: Date;
  notes: string
}
