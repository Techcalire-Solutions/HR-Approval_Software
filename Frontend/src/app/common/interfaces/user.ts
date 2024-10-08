import { Role } from "./role"
import { Team } from "./team"

export interface User {
  id: number,
  name: string,
  email: string,
  phoneNumber: string,
  password: string,
  roleId: number
  role:Role
  status: boolean
  url: string
  userImage: string
  createdAt: Date
  updatedAt: Date

  teamId:number
  team: Team

  empNo: string
  dateOfJoining: Date
  probationPeriod: string
  confirmationDate: Date
  isTemporary: boolean

  maritalStatus: string
  dateOfBirth: Date
  gender: string
  parentName: string
  spouseName: string
  referredBy: string

  probationEndDate: Date
  
}
