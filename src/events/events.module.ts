import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from '../data/user/user.repository';
import { RoomRepository } from '../data/room/Room.repository';
import { ScoreRepository } from '../data/score/score.repository';

@Module({
  providers: [EventsGateway, GameService],
  imports: [TypeOrmModule.forFeature([UserRepository, RoomRepository, ScoreRepository])]
})
export class EventsModule {}