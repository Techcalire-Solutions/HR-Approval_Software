import { OperatorFunction } from "rxjs";
import { TeamMember } from "./teamMember";
import { User } from "../models/user.model";

export interface Team {
    filiter(arg0: OperatorFunction<any, any>): any;
    pipe(arg0: OperatorFunction<any, any>): any;
    map(arg0: (x: any) => any): any;
    id:string;
    teamName: string;
    userId: number;
    teamMembers: TeamMember
    register: User
}
