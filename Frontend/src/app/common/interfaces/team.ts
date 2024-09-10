import { OperatorFunction } from "rxjs";
import { TeamMember } from "./teamMember";
import { User } from "./user";

export interface Team {
  id: number;
  teamName: string;
  userId: number;
  leader: User; // Leader should be of type User based on the data provided.
  teamMembers: TeamMember[]; // This is an array of TeamMember based on your data (Array(4)).
  createdAt: string;
  updatedAt: string;

  // RxJS-related methods can be omitted from the interface unless absolutely necessary.
  filter?(arg0: OperatorFunction<any, any>): any;
  pipe?(arg0: OperatorFunction<any, any>): any;
  map?(arg0: (x: any) => any): any;
}
