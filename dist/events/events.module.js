"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const events_gateway_1 = require("./events.gateway");
const game_service_1 = require("./game.service");
const typeorm_1 = require("@nestjs/typeorm");
const user_repository_1 = require("../data/user/user.repository");
const Room_repository_1 = require("../data/room/Room.repository");
const score_repository_1 = require("../data/score/score.repository");
let EventsModule = class EventsModule {
};
EventsModule = __decorate([
    common_1.Module({
        providers: [events_gateway_1.EventsGateway, game_service_1.GameService],
        imports: [typeorm_1.TypeOrmModule.forFeature([user_repository_1.UserRepository, Room_repository_1.RoomRepository, score_repository_1.ScoreRepository])]
    })
], EventsModule);
exports.EventsModule = EventsModule;
//# sourceMappingURL=events.module.js.map