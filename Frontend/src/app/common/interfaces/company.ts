import { OperatorFunction } from "rxjs";


export interface Company {
  id: number;
  companyName: string;
  code: string;
  contactPerson: string;
  designation: string;
  email: string;
  website: string;
  phoneNumber: string;
  address1: string;
  address2: string;
  city: string;
  country: string;
  state: string;
  zipcode: string;
  linkedIn: string;
  remarks: string;
  customer: string;
  supplier: string;
  createdAt: string;
  updatedAt: string;

  // RxJS-related methods can be omitted from the interface unless absolutely necessary.
  filter?(arg0: OperatorFunction<any, any>): any;
  pipe?(arg0: OperatorFunction<any, any>): any;
  map?(arg0: (x: any) => any): any;
}
