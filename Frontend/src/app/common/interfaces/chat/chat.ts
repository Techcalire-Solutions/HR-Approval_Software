export interface Chat {
    id: number
    toId: number
    fromId: number
    message: string 
    time: Date
    status: string
    deleted: boolean
}
