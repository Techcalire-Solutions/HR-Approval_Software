import { User } from "./user"

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UserAssets {
    id: number
    userId: number
    assetCode: string
    userAssetsDetails: any
    user: User
}
