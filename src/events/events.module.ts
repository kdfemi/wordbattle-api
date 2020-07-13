import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { GameService } from './game.service';
import { RoomEntity } from '../db';

@Module({
  providers: [EventsGateway, GameService, RoomEntity],
})
export class EventsModule {}