import { Role } from "./role"
import { StatutoryInfo } from "./statutory-info"
import { Team } from "./team"
import { UserAccount } from "./user-account"
import { UserPersonal } from "./user-personal"
import { UserPosition } from "./user-position"

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

  separated: boolean
  probationEndDate: Date
  separationNote: string
  separationDate: Date

  userPosition: UserPosition
  userPersonals: UserPersonal[]
  useraccount: UserAccount
  statutoryinfo: StatutoryInfo
}
