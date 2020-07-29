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
import {
  USER_EXIST_IN_GROUP, USER_EXIST_IN_GROUP_CODE, MAX_USER_ALLOWED, MAX_USER_ALLOWED_CODE,
  USERNAME_EXIST_IN_GROUP, USERNAME_EXIST_IN_GROUP_CODE, ROOM_NOT_FOUND, ROOM_NOT_FOUND_CODE, USER_FORBIDDEN,
  USER_FORBIDDEN_CODE, UNKNOWN_ERROR, UNKNOWN_ERROR_CODE
} from '../constant';

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
    const roomEntity = this.roomEntity.getUserRoom(client.id)
    const roomId =roomEntity&&roomEntity.id
    if(roomId) {
      this.leaveRoom({roomId, userId: client.id} ,client);
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
  createRoom(@MessageBody() gameDetails: {username: string, maxLength: number},  @ConnectedSocket() socket: Socket) {
    try {

      const roomId = Math.floor(Math.random() * 100);
      this.roomEntity.rooms.push({
        id: roomId+"",
      creatorId: socket.id, users:  [{id: socket.id, userName: gameDetails.username}],
      gameLength: gameDetails.maxLength,
      scores: [{score: 0, userId: socket.id}],
      played: 0,
      currentWord: ''
      });
      socket.join(""+roomId);
      return {roomId, canGenerateWord: true, userId: socket.id};
    } catch (err) {
      if(!err.error) {
        Logger.log(err);
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('joinRoom')
  joinGameSession(@MessageBody() body: {roomId: string, username: string},  @ConnectedSocket() socket: Socket) {
    try {
      const room = this.roomEntity.findById(body.roomId);
      const userExists = room&&!!room.users.find( user => socket.id === user.id)
      const userNameExists = room&&!!room.users.find( user => body.username.trim().toLowerCase() === user.userName.trim().toLowerCase());
      
      // eslint-disable-next-line @typescript-eslint/camelcase
      if(room && room.users.length < Max_Gamer && !userExists && !userNameExists) {
  
        room.users.push({id: socket.id, userName: body.username});
        room.scores.push({score: 0, userId: socket.id});
        this.roomEntity.save(room);
        const [pl1, pl2] = room.scores;
        const creator = room.users.find(user => user.id !== socket.id)
        const pl1Username = {userId: creator.id, username: creator.userName}
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
      if(!err.error) {
        Logger.log(err);
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('rejoinRoom')
  reJoinGameSession(@MessageBody() body: {roomId: string, userId: string},  @ConnectedSocket() socket: Socket) {
    try {
      const room = this.roomEntity.findById(body.roomId);
      const userExists = room&&!!room.users.find( user => body.userId === user.id);
      
      // eslint-disable-next-line @typescript-eslint/camelcase
      if(room  && userExists) {
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
      if(!err.error) {
        Logger.log(err);
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
    throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
  }

  @SubscribeMessage('generateWord')
  startGame(@MessageBody() body: {roomId: string, userId: string}) {
    try {
      const room = this.roomEntity.findById(body.roomId+"");
      if(room.creatorId !== body.userId || room.currentWord !== '') {
        throw new WsException({message: USER_FORBIDDEN, status: USER_FORBIDDEN_CODE});
      } else {
        ++room.played;
        const generatedWord = this.gameService.generateGameWord()
        room.currentWord = generatedWord.word;
        const played = room.played;
        const gameLength = room.gameLength;
        this.roomEntity.save(room);
        this.server.to(body.roomId).emit('word', {...generatedWord, played, gameLength});
      }
    } catch(err) {
      if(!err.error) {
        Logger.log(err);
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('submit')
  chooseWinner(@MessageBody() data: {roomId: string, secs:number, userId: string, word: string}) {
    try {
      const room = this.roomEntity.findById(data.roomId+"");
      const gamerScores = room.scores;
      const submittedPlayerScoreIndex = gamerScores.findIndex(pl => pl.userId ===  data.userId);
      ++gamerScores[submittedPlayerScoreIndex].score;
      if((room.gameLength > room.played) && (data.word === room.currentWord)) {
  
        const [pl1, pl2] = room.scores
        ++room.played
        const generatedWord = this.gameService.generateGameWord()
        room.currentWord = generatedWord.word;
        this.roomEntity.save(room);
        const played = room.played;
        const gameLength = room.gameLength;
        this.server.to(data.roomId).emit('word', {...generatedWord, played, gameLength})
        this.server.to(data.roomId).emit('score', {pl1, pl2})
      } else {
        const scores = room.scores;
        const [pl1, pl2] =  scores;
        const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? {userId: 'tie', score: pl2.score} : pl2;
        let winnerUsername = '';
        if(pl1.score !== pl2.score) {
          winnerUsername = room.users.find(user => user.id === (winner as {userId: string;
            score: number;}).userId).userName;
            console.log(winnerUsername);
        }
        this.server.to(data.roomId).emit('announceWinner', winner, winnerUsername);
      }

    } catch(err) {
      if(!err.error) {
        Logger.log(err);
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }

  @SubscribeMessage('leave')
  leaveRoom(@MessageBody() data: {roomId: string, userId: string},  @ConnectedSocket() socket: Socket) {
    try {
      const room = this.roomEntity.findById(data.roomId+"");
      const roomIndex = this.roomEntity.rooms.findIndex(rm => room.id === rm.id);
   
      if(room&&room.users.length === 1)  {
        socket.leave(data.roomId);
        return true;
      } else if(room&&room.users.length > 1) {
        const scores = room.scores;
        const [pl1, pl2] =  scores;
        const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? {userId: 'tie', score: pl2.score} : pl2;
        let winnerUsername = '';
        if(pl1.score !== pl2.score) {
          winnerUsername = room.users.find(user => user.id === (winner as {userId: string;
            score: number;}).userId).userName;
        }
        this.server.in(data.roomId).clients((error, socketIds) => {
          if (error) throw error;
          if(room.creatorId === data.userId) {
            this.server.to(data.roomId).emit('over',`creator Closed game`, winner, winnerUsername);
            socketIds.forEach(socketId => this.server.sockets.sockets[socketId].leave(data.roomId));
          } else {
            socket.leave(data.roomId, () => {
              const leftUser = room.users.find(user => user.id === data.userId)
              this.server.to(data.roomId).emit('over',`user ${leftUser&&leftUser.userName} left`, winner, winnerUsername);
            });
          }
        });
      } else {
        socket.leave(data.roomId);
      }
      this.roomEntity.rooms.splice(roomIndex, 1);
      return true;
    } catch(err) {
      if(!err.error) {
        Logger.log(err);
        throw new WsException({message: UNKNOWN_ERROR, status: UNKNOWN_ERROR_CODE});
      }
      throw new WsException(err.error)
    }
  }
}