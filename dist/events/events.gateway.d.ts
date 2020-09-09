import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { RoomRepository } from '../data/room/Room.repository';
import { UserRepository } from '../data/user/user.repository';
export declare class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly gameService;
    private readonly roomRepository;
    private readonly userRepository;
    private readonly configService;
    constructor(gameService: GameService, roomRepository: RoomRepository, userRepository: UserRepository, configService: ConfigService);
    server: Server;
    private logger;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    handleTest(socket: Socket): string;
    createRoom(gameDetails: {
        username: string;
        maxLength: number;
    }, socket: Socket): Promise<{
        roomId: string;
        canGenerateWord: boolean;
        userId: string;
    }>;
    joinGameSession(body: {
        roomId: string;
        username: string;
    }, socket: Socket): Promise<{
        roomId: string;
        canGenerateWord: boolean;
        userId: string;
    }>;
    reJoinGameSession(body: {
        roomId: string;
        userId: string;
    }, socket: Socket): Promise<void>;
    startGame(body: {
        roomId: string;
        userId: string;
    }): Promise<void>;
    chooseWinner(data: {
        roomId: string;
        secs: number;
        userId: string;
        word: string;
    }): Promise<void>;
    leaveRoom(data: {
        roomId: string;
        userId: string;
    }, socket: Socket): Promise<boolean>;
    cancelGame(data: {
        roomId: string;
        userId: string;
    }, socket: Socket): Promise<boolean>;
}
