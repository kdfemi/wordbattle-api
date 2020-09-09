"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const websockets_1 = require("@nestjs/websockets");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const constant_1 = require("../constant");
const Room_repository_1 = require("../data/room/Room.repository");
const user_repository_1 = require("../data/user/user.repository");
const Room_entity_1 = require("../data/room/Room.entity");
const user_entity_1 = require("../data/user/user.entity");
const score_entity_1 = require("../data/score/score.entity");
let EventsGateway = class EventsGateway {
    constructor(gameService, roomRepository, userRepository, configService) {
        this.gameService = gameService;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.logger = new common_1.Logger('AppGateway');
    }
    afterInit() {
        this.logger.log('WebSocketServer Init');
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    async handleDisconnect(client) {
        const user = await this.userRepository.findOne({ where: { socketId: client.id } });
        if (user) {
            this.leaveRoom({ roomId: user.roomId, userId: client.id }, client);
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleTest(socket) {
        console.log('I Called you');
        console.log('I Called you =======>', socket.id);
        return 'Tested';
    }
    async createRoom(gameDetails, socket) {
        try {
            const user = new user_entity_1.User();
            user.id = socket.id;
            user.username = gameDetails.username.trim();
            const score = new score_entity_1.Score();
            score.user = user;
            const room = new Room_entity_1.Room();
            room.users = [user];
            room.scores = [score];
            room.creatorId = socket.id;
            room.gameLength = gameDetails.maxLength;
            score.room = room;
            const createdRoom = await room.save();
            const roomId = createdRoom.id;
            socket.join(roomId);
            return { roomId, canGenerateWord: true, userId: socket.id };
        }
        catch (err) {
            const log = new common_1.Logger('CREATE ROOM');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
    }
    async joinGameSession(body, socket) {
        try {
            const room = await this.roomRepository.findOne(body.roomId.trim());
            const userExists = room && !!room.users.find(user => socket.id === user.id);
            const userNameExists = room && !!room.users.find(user => body.username.trim().toLowerCase() === user.username.trim().toLowerCase());
            const maxGamers = this.configService.get('Max_Gamer');
            if (room && room.users.length < maxGamers && !userExists && !userNameExists) {
                const user = new user_entity_1.User();
                user.id = socket.id;
                user.username = body.username.trim();
                const score = new score_entity_1.Score();
                score.user = user;
                room.users.push(user);
                room.scores.push(score);
                const updatedRoom = await room.save();
                const [pl1, pl2] = updatedRoom.scores;
                const creator = room.users.find(user => user.id !== socket.id);
                const pl1Username = { userId: creator.id, username: creator.username };
                const pl2Username = { userId: socket.id, username: body.username };
                socket.join(body.roomId, () => {
                    this.server.to(room.id).emit('startGame', { pl1, pl2 }, { pl1Username, pl2Username });
                });
                return { roomId: body.roomId, canGenerateWord: false, userId: socket.id };
            }
            else if (room && userExists) {
                throw new websockets_1.WsException({ message: constant_1.USER_EXIST_IN_GROUP, status: constant_1.USER_EXIST_IN_GROUP_CODE });
            }
            else if (room && room.users.length >= 2) {
                throw new websockets_1.WsException({ message: constant_1.MAX_USER_ALLOWED, status: constant_1.MAX_USER_ALLOWED_CODE });
            }
            else if (room && userNameExists) {
                throw new websockets_1.WsException({ message: constant_1.USERNAME_EXIST_IN_GROUP, status: constant_1.USERNAME_EXIST_IN_GROUP_CODE });
            }
            else if (!room) {
                throw new websockets_1.WsException({ message: constant_1.ROOM_NOT_FOUND, status: constant_1.ROOM_NOT_FOUND_CODE });
            }
            else {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
        }
        catch (err) {
            const log = new common_1.Logger('JOIN ROOM');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
    }
    async reJoinGameSession(body, socket) {
        try {
            const room = await this.roomRepository.findOne(body.roomId);
            const user = room && room.users.find(user => body.userId === user.id);
            const userExists = room && !!user;
            if (room && userExists) {
                user.socketId = socket.id;
                await user.save();
                socket.join(body.roomId, () => {
                    socket.to(room.id).emit('rejoined');
                });
                return;
            }
            else if (room && !userExists) {
                throw new websockets_1.WsException({ message: constant_1.USER_EXIST_IN_GROUP, status: constant_1.USER_EXIST_IN_GROUP_CODE });
            }
            else if (!room) {
                throw new websockets_1.WsException({ message: constant_1.ROOM_NOT_FOUND, status: constant_1.ROOM_NOT_FOUND_CODE });
            }
        }
        catch (err) {
            const log = new common_1.Logger('REJOIN ROOM');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
        throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
    }
    async startGame(body) {
        try {
            const room = await this.roomRepository.findOne(body.roomId);
            if (room.creatorId !== body.userId || room.currentWord !== '') {
                throw new websockets_1.WsException({ message: constant_1.USER_FORBIDDEN, status: constant_1.USER_FORBIDDEN_CODE });
            }
            else {
                ++room.played;
                const generatedWord = await this.gameService.generateGameWord();
                room.currentWord = generatedWord.word;
                const played = room.played;
                const gameLength = room.gameLength;
                await room.save();
                this.server.to(body.roomId).emit('word', Object.assign({}, generatedWord, { played, gameLength }));
            }
        }
        catch (err) {
            const log = new common_1.Logger('GENERATE WORD');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
    }
    async chooseWinner(data) {
        try {
            const room = await this.roomRepository.findOne(data.roomId);
            const gamerScores = room.scores;
            const submittedPlayerScoreIndex = gamerScores.findIndex(pl => pl.userId === data.userId);
            ++gamerScores[submittedPlayerScoreIndex].score;
            if ((room.gameLength > room.played) && (data.word.trim().toLowerCase() === room.currentWord.trim().toLowerCase())) {
                const [pl1, pl2] = room.scores;
                ++room.played;
                const generatedWord = await this.gameService.generateGameWord();
                room.currentWord = generatedWord.word;
                await room.save();
                const played = room.played;
                const gameLength = room.gameLength;
                this.server.to(data.roomId).emit('word', Object.assign({}, generatedWord, { played, gameLength }));
                this.server.to(data.roomId).emit('score', { pl1, pl2 });
            }
            else if (data.word.trim().toLowerCase() !== room.currentWord.trim().toLowerCase()) {
                throw new websockets_1.WsException({ message: constant_1.INVALID_WORD, status: constant_1.INVALID_WORD_CODE });
            }
            else {
                const scores = room.scores;
                const [pl1, pl2] = scores;
                const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? { userId: 'tie', score: pl2.score } : pl2;
                let winnerUsername = '';
                if (pl1.score !== pl2.score) {
                    winnerUsername = room.users.find(user => user.id === winner.userId).username;
                }
                this.server.to(data.roomId).emit('announceWinner', winner, winnerUsername);
                room.remove();
            }
        }
        catch (err) {
            const log = new common_1.Logger('SUBMIT WORD');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
    }
    async leaveRoom(data, socket) {
        try {
            const room = await this.roomRepository.findOne(data.roomId);
            if (room && room.users.length === 1) {
                socket.leave(data.roomId);
            }
            else if (room && room.users.length > 1) {
                const scores = room.scores;
                const [pl1, pl2] = scores;
                const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? { userId: 'tie', score: pl2.score } : pl2;
                let winnerUsername = '';
                if (pl1.score !== pl2.score) {
                    winnerUsername = room.users.find(user => user.id === winner.userId).username;
                }
                this.server.in(data.roomId).clients((error, socketIds) => {
                    if (error)
                        throw error;
                    let message = null;
                    if (room.creatorId === data.userId) {
                        message = 'over', `creator Closed game`;
                    }
                    else {
                        const leftUser = room.users.find(user => user.id === data.userId);
                        message = `user ${leftUser && leftUser.username} left`;
                    }
                    this.server.to(data.roomId).emit('over', message, winner, winnerUsername);
                    socketIds.forEach(socketId => this.server.sockets.sockets[socketId].leave(data.roomId));
                });
            }
            else {
                socket.leave(data.roomId);
            }
            room.remove();
            return true;
        }
        catch (err) {
            const log = new common_1.Logger('LEAVE ROOM');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
    }
    async cancelGame(data, socket) {
        try {
            const room = await this.roomRepository.findOne(data.roomId);
            if (room) {
                const scores = room.scores;
                const [pl1, pl2] = scores;
                const winner = pl1.score > pl2.score ? pl1 : pl1.score === pl2.score ? { userId: 'tie', score: pl2.score } : pl2;
                let winnerUsername = '';
                if (pl1.score !== pl2.score) {
                    winnerUsername = room.users.find(user => user.id === winner.userId).username;
                }
                this.server.in(data.roomId).clients((error, socketIds) => {
                    if (error)
                        throw error;
                    let message = null;
                    if (room.creatorId === data.userId) {
                        message = `creator Closed game`;
                    }
                    else {
                        const leftUser = room.users.find(user => user.id === data.userId);
                        message = `user ${leftUser && leftUser.username} left`;
                    }
                    this.server.to(data.roomId).emit('over', message, winner, winnerUsername, data.userId);
                    socketIds.forEach(socketId => this.server.sockets.sockets[socketId].leave(data.roomId));
                });
            }
            else {
                socket.leave(data.roomId);
            }
            room.remove();
            return true;
        }
        catch (err) {
            const log = new common_1.Logger('LEAVE ROOM');
            log.error(err);
            if (!err.error) {
                throw new websockets_1.WsException({ message: constant_1.UNKNOWN_ERROR, status: constant_1.UNKNOWN_ERROR_CODE });
            }
            throw new websockets_1.WsException(err.error);
        }
    }
};
__decorate([
    websockets_1.WebSocketServer(),
    __metadata("design:type", Object)
], EventsGateway.prototype, "server", void 0);
__decorate([
    websockets_1.SubscribeMessage('test'),
    __param(0, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleTest", null);
__decorate([
    websockets_1.SubscribeMessage('createRoom'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "createRoom", null);
__decorate([
    websockets_1.SubscribeMessage('joinRoom'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "joinGameSession", null);
__decorate([
    websockets_1.SubscribeMessage('rejoinRoom'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "reJoinGameSession", null);
__decorate([
    websockets_1.SubscribeMessage('generateWord'),
    __param(0, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "startGame", null);
__decorate([
    websockets_1.SubscribeMessage('submit'),
    __param(0, websockets_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "chooseWinner", null);
__decorate([
    websockets_1.SubscribeMessage('leave'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "leaveRoom", null);
__decorate([
    websockets_1.SubscribeMessage('cancel'),
    __param(0, websockets_1.MessageBody()), __param(1, websockets_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "cancelGame", null);
EventsGateway = __decorate([
    websockets_1.WebSocketGateway({
        pingInterval: 20000,
        pingTimeout: 5000,
    }),
    __metadata("design:paramtypes", [game_service_1.GameService,
        Room_repository_1.RoomRepository,
        user_repository_1.UserRepository,
        config_1.ConfigService])
], EventsGateway);
exports.EventsGateway = EventsGateway;
//# sourceMappingURL=events.gateway.js.map