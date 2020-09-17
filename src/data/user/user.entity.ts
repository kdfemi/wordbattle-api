import { Entity, PrimaryColumn, Column, ManyToOne, OneToOne, BeforeInsert } from 'typeorm';
import { SuperEntity } from '../SuperEntity';
import { Room } from '../room/Room.entity';
import { Score } from '../score/score.entity';

@Entity()
export class User extends SuperEntity{

    @PrimaryColumn()
    id: string;

    @Column()
    username: string;

    @ManyToOne(() => Room, room => room.users,  {onDelete: 'CASCADE'})
    room: Room;

    @Column()
    roomId: string;

    @Column()
    socketId: string;

    @OneToOne(() => Score, score => score.user, {cascade: true, eager: false})
    score: Score

    @BeforeInsert()
    private setSocketId () {
        this.socketId = this.id;
    }

}
