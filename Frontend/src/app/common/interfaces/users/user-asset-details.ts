import { User } from "./user";
import { UserAssets } from "./user-assets";

export interface UserAssetDetail {
  id: number;
  userAssetId: number;
  userId: number;
  userAsset?: UserAssets;
  user: User;
  createdAt?: Date;
  updatedAt?: Date;
}