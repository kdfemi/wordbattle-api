import { BaseEntity } from 'typeorm';
import { User } from '../user/user.entity';
import { Score } from '../score/score.entity';
export declare class Room extends BaseEntity {
    id: string;
    creatorId: string;
    users: User[];
    gameLength: number;
    scores: Score[];
    played: number;
    currentWord: string;
    generateOTP(): void;
}
