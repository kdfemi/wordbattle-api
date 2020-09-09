import { BaseEntity } from 'typeorm';
import { Room } from '../room/Room.entity';
import { Score } from '../score/score.entity';
export declare class User extends BaseEntity {
    id: string;
    username: string;
    room: Room;
    roomId: string;
    socketId: string;
    score: Score;
    private setSocketId;
}
