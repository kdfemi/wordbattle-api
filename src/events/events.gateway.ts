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
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { Server, Socket } from 'socket.io';

import { GameService } from './game.service';
import {
  USER_EXIST_IN_GROUP, USER_EXIST_IN_GROUP_CODE, MAX_USER_ALLOWED, MAX_USER_ALLOWED_CODE,
  USERNAME_EXIST_IN_GROUP, USERNAME_EXIST_IN_GROUP_CODE, ROOM_NOT_FOUND, ROOM_NOT_FOUND_CODE, USER_FORBIDDEN,
  USER_FORBIDDEN_CODE, UNKNOWN_ERROR, UNKNOWN_ERROR_CODE, INVALID_WORD, INVALID_WORD_CODE
} from '../constant';

import { RoomRepository } from '../data/room/Room.repository';
import { UserRepository } from '../data/user/user.repository';

import { Room } from '../data/room/Room.entity';
import { User } from '../data/user/user.entity';
import { Score } from '../data/score/score.entity';

@WebSocketGateway({
  pingInterval: 20000,
  pingTimeout: 5000,
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect  {
 
  constructor(
    private readonly gameService: GameService,
    private readonly roomRepository: RoomRepository,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService
  ) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AppGateway');
  
  afterInit() {
    this.logger.log('WebSocketServer Init');
  }
  
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    const user = await this.userRepository.findOne({where: {socketId: client.id}});
    if(user) {
      this.leaveRoom({roomId: user.roomId, userId: client.id} ,client);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('test')
  handleTest( @ConnectedSocket() socket: Socket) {
    console.log('I Called you')
    console.log('I Called you =======>', socket.id)
    return 'Tested'
  }

  @SubscribeMessage('createRoom')
  async createRoom(@MessageBody() gameDetails: {username: string, maxLength: number},  @ConnectedSocket() socket: Socket) {
    try {

      const user = new User()
      user.id = socket.id;
      user.username = gameDetails.username.trim();
      
      const score = new Score();
      score.user = user;
      
      
      const room = new Room();
      room.users = [user];
      room.scores = [score];
      room.creatorId = socket.id;
      room.gameLength = gameDetails.maxLength;
      
      score.room = room;
      

      const createdRoom = await room.save();
      
      const roomId = createdRoom.id;
      socket.join(roomId);

      return {roomId, canGenerateWord: true, userId: socket.id};
    } catch (err) {
      const log = new Logger('CREATE ROOM')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('joinRoom')
  async joinGameSession(@MessageBody() body: {roomId: string, username: string},  @ConnectedSocket() socket: Socket) {
    try {
      const room = await this.roomRepository.findOne(body.roomId.trim());
      const userExists = room&&!!room.users.find( user => socket.id === user.id)
      const userNameExists = room&&!!room.users.find( user => body.username.trim().toLowerCase() === user.username.trim().toLowerCase());
      const maxGamers = this.configService.get<number>('Max_Gamer');

      if(room && room.users.length < maxGamers && !userExists && !userNameExists) {
        const user = new User()
        user.id = socket.id;
        user.username = body.username.trim();

        const score = new Score();
        score.user = user;
        
        room.users.push(user);
        room.scores.push(score);
        const updatedRoom = await room.save();
        const [pl1, pl2] = updatedRoom.scores;
        const creator = room.users.find(user => user.id !== socket.id)
        const pl1Username = {userId: creator.id, username: creator.username}
        const pl2Username = {userId: socket.id, username: body.username}
        socket.join(body.roomId, () => {
          this.server.to(room.id).emit('startGame', {pl1, pl2}, {pl1Username, pl2Username});
        });
        return {roomId:body.roomId, canGenerateWord: false, userId: socket.id};
      } else if(room && userExists ) {
  
        throw new WsException({message: USER_EXIST_IN_GROUP, status: USER_EXIST_IN_GROUP_CODE});
  
      } else if(room && room.users.length >= 2) {
  
        throw new WsException({message: MAX_USER_ALLOWED, status: MAX_USER_ALLOWED_CODE});
  
      } else if(room && userNameExists) {
  
        throw new WsException({message: USERNAME_EXIST_IN_GROUP, status: USERNAME_EXIST_IN_GROUP_CODE});
  
      }else if(!room) {
  
        throw new WsException({message: ROOM_NOT_FOUND, status: ROOM_NOT_FOUND_CODE});
  
      } else {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
    } catch(err) {
      const log = new Logger('JOIN ROOM')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('rejoinRoom')
  async reJoinGameSession(@MessageBody() body: {roomId: string, userId: string},  @ConnectedSocket() socket: Socket) {
    try {

      const room = await this.roomRepository.findOne(body.roomId);
      const user = room&&room.users.find( user => body.userId === user.id);
      const userExists = room&&!!user;
      
      if(room  && userExists) {
        user.socketId = socket.id;
        await user.save();
        socket.join(body.roomId, () => {
          socket.to(room.id).emit('rejoined');
        });
        return;
      } else if(room && !userExists ) {
  
        throw new WsException({message: USER_EXIST_IN_GROUP, status: USER_EXIST_IN_GROUP_CODE});
  
      } else if(!room) {
        throw new WsException({message: ROOM_NOT_FOUND, status: ROOM_NOT_FOUND_CODE});
      }
    } catch(err) {
      const log = new Logger('REJOIN ROOM')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
    throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
  }

  @SubscribeMessage('generateWord')
  async startGame(@MessageBody() body: {roomId: string, userId: string}) {
    try {
      const room = await this.roomRepository.findOne(body.roomId);
      if(room.creatorId !== body.userId || room.currentWord !== '') {
        throw new WsException({message: USER_FORBIDDEN, status: USER_FORBIDDEN_CODE});
      } else {
        ++room.played;
        const generatedWord = await this.gameService.generateGameWord()
        room.currentWord = generatedWord.word;
        const played = room.played;
        const gameLength = room.gameLength;
        await room.save();
        this.server.to(body.roomId).emit('word', {...generatedWord, played, gameLength});
      }
    } catch(err) {
      const log = new Logger('GENERATE WORD')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('submit')
  async chooseWinner(@MessageBody() data: {roomId: string, secs:number, userId: string, word: string}) {
    try {
      const room = await this.roomRepository.findOne(data.roomId);
      const gamerScores = room.scores;

      const submittedPlayerScoreIndex = gamerScores.findIndex(pl => pl.userId ===  data.userId);
      ++gamerScores[submittedPlayerScoreIndex].score;

      if((room.gameLength > room.played) && (data.word.trim().toLowerCase() === room.currentWord.trim().toLowerCase())) {
  
        const [pl1, pl2] = room.scores
        ++room.played
        const generatedWord = await this.gameService.generateGameWord()
        room.currentWord = generatedWord.word;
        await room.save();
        const played = room.played;
        const gameLength = room.gameLength;
        this.server.to(data.roomId).emit('word', {...generatedWord, played, gameLength})
        this.server.to(data.roomId).emit('score', {pl1, pl2})
      } else if(data.word.trim().toLowerCase() !== room.currentWord.trim().toLowerCase()) {
        throw new WsException({message: INVALID_WORD, status: INVALID_WORD_CODE})
      } else {
        const scores = room.scores;
        const [pl1, pl2] =  scores;
        const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? {userId: 'tie', score: pl2.score} : pl2;
        let winnerUsername = '';
        if(pl1.score !== pl2.score) {
          winnerUsername = room.users.find(user => user.id === winner.userId).username;
        }
        this.server.to(data.roomId).emit('announceWinner', winner, winnerUsername);
        room.remove();
      }

    } catch(err) {
      const log = new Logger('SUBMIT WORD')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('leave')
  async leaveRoom(@MessageBody() data: {roomId: string, userId: string},  @ConnectedSocket() socket: Socket) {
    try {
      const room = await this.roomRepository.findOne(data.roomId);
      if(room&&room.users.length === 1)  {
        socket.leave(data.roomId);
      } else if(room&&room.users.length > 1) {
        const scores = room.scores;
        const [pl1, pl2] =  scores;
        const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? {userId: 'tie', score: pl2.score} : pl2;
        let winnerUsername = '';
        if(pl1.score !== pl2.score) {
          winnerUsername = room.users.find(user => user.id === (winner as {userId: string;
            score: number;}).userId).username;
        }
        this.server.in(data.roomId).clients((error, socketIds) => {
          if (error) throw error;
          let message = null;
          if(room.creatorId === data.userId) {
            message = 'over',`creator Closed game`;
          } else {
            const leftUser = room.users.find(user => user.id === data.userId);
            message = `user ${leftUser&&leftUser.username} left`;
          }
          this.server.to(data.roomId).emit('over', message, winner, winnerUsername);
          socketIds.forEach(socketId => this.server.sockets.sockets[socketId].leave(data.roomId));
        });
      } else {
        socket.leave(data.roomId);
      }
      room.remove();
      return true;
    } catch(err) {
      const log = new Logger('LEAVE ROOM')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('cancel')
  async cancelGame(@MessageBody() data: {roomId: string, userId: string},  @ConnectedSocket() socket: Socket) {
    try {
      const room = await this.roomRepository.findOne(data.roomId);
      if(room) {
        const scores = room.scores;
        const [pl1, pl2] =  scores;
        const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? {userId: 'tie', score: pl2.score} : pl2;
        let winnerUsername = '';
        if(pl1.score !== pl2.score) {
          winnerUsername = room.users.find(user => user.id === (winner as {userId: string;
            score: number;}).userId).username;
        }
        this.server.in(data.roomId).clients((error, socketIds) => {
          if (error) throw error;
          let message = null;
          if(room.creatorId === data.userId) {
            message = `creator Closed game`;
          } else {
            const leftUser = room.users.find(user => user.id === data.userId);
            message = `user ${leftUser&&leftUser.username} left`;
          }
          this.server.to(data.roomId).emit('over', message, winner, winnerUsername, data.userId);
          socketIds.forEach(socketId => this.server.sockets.sockets[socketId].leave(data.roomId));
        });
      } else {
        socket.leave(data.roomId);
      }
      room.remove();
      return true;
    } catch(err) {
      const log = new Logger('LEAVE ROOM')
      log.error(err);
      if(!err.error) {
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }
}