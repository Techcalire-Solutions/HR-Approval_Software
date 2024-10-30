import { LeaveType } from "./leaveType";
import { User } from "./user";

export interface Leave {
  id: number; // Assuming this is the primary key
  userId: number;
  leaveTypeId: number;
  leaveType: LeaveType; // Association to LeaveType
  user: User; // Association to User
  startDate: Date; // Start date of the leave
  endDate: Date; // End date of the leave
  noOfDays: number; // Number of days for the leave
  notes?: string; // Optional notes for the leave
  status: string; // Current status of the leave
  session1: boolean; // Indicates if session 1 is included
  session2: boolean; // Indicates if session 2 is included
  fileUrl?: string; // Optional URL for any file associated with the leave
  leaveDates: Date[]; // Array of dates for the leave
}
