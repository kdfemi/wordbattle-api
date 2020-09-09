import { BaseEntity } from 'typeorm';
import { Room } from '../room/Room.entity';
import { User } from '../user/user.entity';
export declare class Score extends BaseEntity {
    id: string;
    user: User;
    score: number;
    room: Room;
    userId: string;
    roomId: string;
}
