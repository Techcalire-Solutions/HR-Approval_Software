
import { Designation } from "./designation";
import { Team } from "./team";
import { User } from "./user";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UserPosition {
  id: number;
  userId : number
  division : string
  costCentre : string
  grade : string
  location : string
  department : any
  office  : string
  salary : string
  probationPeriod : number
  officialMailId: string
  projectMailId: string
  probationNote: string
  user: User
  designationId: number
  designation: Designation
  teamId: number;
  team: Team;
  confirmationDate: Date
}
