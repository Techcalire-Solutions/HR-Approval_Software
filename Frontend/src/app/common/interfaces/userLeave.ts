import { LeaveType } from "./leaveType"

export interface UserLeave{
    id: number,
    userId : number
    leaveTypeId : number
    noOfDays : number
    takenLeaves : number
    leaveBalance : number
    leaveType: LeaveType
}

