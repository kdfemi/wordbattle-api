import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/camelcase
import {RoomEntity, Max_Gamer} from '../db';
import { GameService } from './game.service';

@WebSocketGateway()
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect  {
 
  constructor(
    private readonly gameService: GameService,
    private readonly roomEntity:RoomEntity
  ) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');
  
  afterInit() {
    this.logger.log('Init');
  }
  
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const roomId = this.roomEntity.getUserRoom(client.id).id
    if(roomId) {
      this.leaveRoom({roomId, userId: client.id} ,client);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createRoom')
  createRoom(@MessageBody() gameDetails: {username: string, maxLength: number},  @ConnectedSocket() socket: Socket) {
    const roomId = Math.floor(Math.random() * 100);
    this.roomEntity.rooms.push({
      id: roomId+"",
    creatorId: socket.id, users:  [{id: socket.id, userName: gameDetails.username}],
    gameLength: gameDetails.maxLength,
    scores: [{score: 0, userId: socket.id}],
    played: 0
    });
    socket.join(""+roomId);
    return {roomId, canGenerateWord: true, userId: socket.id};
  }

  @SubscribeMessage('joinRoom')
  joinGameSession(@MessageBody() body: {roomId: string, username: string},  @ConnectedSocket() socket: Socket) {
    
    const room = this.roomEntity.findById(body.roomId);
    const userExists = !!room.users.find( user => socket.id === user.id)
    
    // eslint-disable-next-line @typescript-eslint/camelcase
    if(room && room.users.length < Max_Gamer && !userExists) {

      socket.join(body.roomId);
      room.users.push({id: socket.id, userName: body.username});
      room.scores.push({score: 0, userId: socket.id});
      this.roomEntity.save(room);
      const [pl1, pl2] = room.scores
      this.server.to(room.id).emit('startGame', {pl1, pl2});
      return {roomId:body.roomId, canGenerateWord: false, userId: socket.id};
    } else if(room && userExists ) {

      throw new WsException('You are already in this group');

    } else if(room && room.users.length >= 2) {

      throw new WsException('only two players are allowed');

    } else {

      throw new WsException('room doesn\'t exists');

    }
  }

  @SubscribeMessage('generatedWord')
  startGame(@MessageBody() body: {roomId: string, userId: string}) {
    const room = this.roomEntity.findById(body.roomId);
    if(room.creatorId !== body.userId) {
      throw new WsException('You didn\'t start the game you can\'t generate words');
    }
    ++room.played
    this.roomEntity.save(room);
    this.server.to(body.roomId).emit('word', this.gameService.generateGameWord())
  }

  @SubscribeMessage('submit')
  chooseWinner(@MessageBody() data: {roomId: string, secs:number, userId: string}) {
    const room = this.roomEntity.findById(data.roomId);
    const gamerScores = room.scores;
    const submittedPlayerScoreIndex = gamerScores.findIndex(pl => pl.userId ===  data.userId);
    ++gamerScores[submittedPlayerScoreIndex].score;
    if(room.gameLength <= room.played) {
      const [pl1, pl2] = room.scores
      this.server.to(data.roomId).emit('next', {pl1, pl2})
    } else {
      const scores = room.scores;
      const [pl1, pl2] =  scores;
      const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? true : pl2;
      this.server.to(data.roomId).emit('announceWinner', winner);
    }
  }

  @SubscribeMessage('leave')
  leaveRoom(@MessageBody() data: {roomId: string, userId: string},  @ConnectedSocket() socket: Socket) {
    const room = this.roomEntity.findById(data.roomId);
    if(room.users.length === 1)  {
      socket.leave(data.roomId);
      return true;
    } else {
      const scores = room.scores;
      const [pl1, pl2] =  scores;
      const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? true : pl2;
      this.server.in(data.roomId).clients((error, socketIds) => {
        if (error) throw error;
        if(room.creatorId === data.userId) {
          this.server.to(data.roomId).emit('close',`creator Closed game`, winner);
          socketIds.forEach(socketId => this.server.sockets.sockets[socketId].leave(data.roomId));
        } else {
          socket.leave(data.roomId, () => {
            const leftUser = room.users.find(user => user.id === data.userId)
            this.server.to(data.roomId).emit('left',`user ${leftUser.userName} left`, winner);
          });
        }
      });
    }
  }
}