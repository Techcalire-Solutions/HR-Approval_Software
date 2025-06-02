
export interface UserAssets {
  id: number;
  assetName: string;
  assetNumber: string;
  assetHandoverNumber: string;
  description: string;
  serialNumber: string;
  purchasedDate:Date
  purchasedFrom: string
  invoiceNo: string
  status: boolean
  assignedStatus: boolean
  createdAt?: Date;
  updatedAt?: Date;
}
