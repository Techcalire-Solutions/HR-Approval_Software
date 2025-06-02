import { Designation } from "./designation";
import { User } from "./user";

export interface Promotion {
  id: number;
  userId: string;
  previousPosition: string;
  designationId: string;
  previousSalary: number;
  newSalary: number;
  effectiveDate: Date | string;
  promotionReason: string;
  promotionDate: Date | string;
  Designation: Designation;
  oldDesignation: Designation
  user:User
}
