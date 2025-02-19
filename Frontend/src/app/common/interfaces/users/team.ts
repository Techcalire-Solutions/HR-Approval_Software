import { OperatorFunction } from "rxjs";
import { TeamMember } from "./teamMember";
import { User } from "./user";
import { TeamLeader } from "./team-leader";

export interface Team {
  id: number;
  teamName: string;
  userId: number;
  team_leaders: TeamLeader[];
  team_members: TeamMember[]; // This is an array of TeamMember based on your data (Array(4)).
  createdAt: string;
  updatedAt: string;
}
