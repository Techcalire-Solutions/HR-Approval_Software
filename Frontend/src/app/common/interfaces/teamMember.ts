
import { Team } from "./team";
import { User } from "./user";

export interface TeamMember {
    name: any;
    filter(arg0: (x: TeamMember) => any): unknown;
    id:string;
    teamId: number;
    userId: number;

    team: Team
    user: User
}
