export declare class RoomEntity {
    readonly rooms: Room[];
    findById: (id: any) => Room;
    save: (entity: Room) => void;
    getUserRoom: (id: string) => Room;
}
export interface Room {
    id: string;
    users: User[];
    creatorId: string;
    gameLength: number;
    scores: {
        userId: string;
        score: number;
    }[];
    played: number;
    currentWord: string;
}
export interface User {
    id: string;
    userName: string;
}
