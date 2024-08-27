import { Role } from "../interfaces/role";

export class User {
  id: number;
  name: string
  email:string
  phoneNumber: string
  password: string
  roleId: number
  status: boolean
  image: string
  role: Role
}

export class UserProfile {
  name: string;
  surname: string;
  birthday: Object;
  gender: string;
  image: string;
}

export class UserWork {
  company: string;
  position: string;
  salary: number;
}

export class UserContacts {
  email: string;
  phone: string;
  address: string;
}

export class UserSocial {
  facebook: string;
  twitter: string;
  google: string;
}

export class UserSettings {
  isActive: boolean;
  isDeleted: boolean;
  registrationDate: Date;
  joinedDate: Date;
}
