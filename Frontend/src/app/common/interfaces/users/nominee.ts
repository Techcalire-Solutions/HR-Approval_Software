import { User } from "./user";

export interface Nominee {
    id: number;
    userId: number;
    nomineeName: string
    nomineeContactNumber: string
    nomineeRelation: string
    aadhaarNumber: string;
    user: User
}
