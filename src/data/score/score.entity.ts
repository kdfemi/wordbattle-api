import { Entity, Column, BaseEntity, ManyToOne, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Room } from '../room/Room.entity';
import { User } from '../user/user.entity';

@Entity()
export class Score extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: string

    @OneToOne(() => User, user=> user.score, {onDelete: 'CASCADE', eager: false})
    @JoinColumn()
    user: User;
    
    @Column({default: 0})
    score: number;

    @ManyToOne(() => Room, room => room.scores, {onDelete: 'CASCADE'})
    room: Room;

    @Column()
    userId: string;

    @Column()
    roomId: string;
}
