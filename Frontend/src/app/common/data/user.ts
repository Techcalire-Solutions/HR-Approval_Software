// src/app/common/data/user.ts
export interface User {
  id: number;
  name: string;
  email?: string; // Include optional properties if they exist in data
  phoneNumber?: string;
  password?: string;
  // createdAt: any; // Remove if not present in the data
}
