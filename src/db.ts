import { Injectable } from "@nestjs/common";

@Injectable({})
export class RoomEntity {
    readonly rooms:Room[] = [];

    /**
     * Returns the first found room
     * @param id 
     * @returns Room
     */
    findById = (id): Room => this.rooms.find( rm => rm.id === id);

    /**
     * Returns the first found room
     * @param id 
     * @returns Room
     */
    save = (entity: Room) => {
        const index = this.rooms.findIndex( rm => rm.id === entity.id);
        this.rooms[index] = entity;
    };

    getUserRoom = (id: string) => this.rooms.find( room => room.users.find(user => user.id == id) !== null );
}

export interface Room {
    id: string;
    users: User[];
    creatorId: string;
    gameLength: number;
    scores: {userId: string, score: number}[];
    played: number;
    currentWord: string;
}

export interface User {
    id: string;
    userName: string;
}

// eslint-disable-next-line @typescript-eslint/camelcase
export const Max_Gamer = 2;
