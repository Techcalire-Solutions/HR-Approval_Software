import { User } from "./user"

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UserAssets {
    id: number
    userId: number
    assetCode: string
    assets: any
    user: User
}
