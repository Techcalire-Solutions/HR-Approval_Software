import { Team } from "./team";
import { User } from "./user";

export interface TeamLeader {
    id: number;
    teamId: number;
    userId: number;

    team: Team
    user: User
}
