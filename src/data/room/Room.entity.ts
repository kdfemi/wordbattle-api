import { Entity, Column, PrimaryColumn, BaseEntity, OneToMany, BeforeInsert } from 'typeorm';
import { User } from '../user/user.entity';
import { Score } from '../score/score.entity';
import { Logger } from '@nestjs/common';


@Entity()
export class Room extends BaseEntity{
  @PrimaryColumn({length: 6})
  id: string;

  @Column()
  creatorId: string;

  @OneToMany(() => User, user => user.room, {cascade: true, eager: true})
  users: User[];

  @Column()
  gameLength: number;

  @OneToMany(() => Score, score => score.room, {cascade: true, eager: true})
  scores: Score[];

  @Column({default: 0})
  played: number;

  @Column({default: ''})
  currentWord: string;

  @BeforeInsert()
  generateOTP() {           
    const string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
    let OTP = ''; 
    const stringLength = string.length; 
    for (let i = 0; i < 6; i++ ) { 
      OTP += string[Math.floor(Math.random() * stringLength)]; 
    }
    const log =  new Logger('OTP')
    log.log(OTP);
    this.id = OTP; 
  } 
}

