import { User } from "./user"

export interface UserPersonal {
  id: number
  userId: number
  empNo: string
  dateOfJoining: Date
  probationPeriod: string
  confirmationDate: Date
  isTemporary: boolean
  emergencyContactNo: string,
  emergencyContactName: string,
  emergencyContactRelation: string, 
  bloodGroup: string

  maritalStatus: string
  dateOfBirth: Date
  gender: string
  parentName: string
  spouseName: string
  referredBy: string
  reportingManger: number

  user: User;
  age: number;
  exp: number;
}
