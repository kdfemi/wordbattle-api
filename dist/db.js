"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
let RoomEntity = class RoomEntity {
    constructor() {
        this.rooms = [];
        this.findById = (id) => this.rooms.find(rm => rm.id === id);
        this.save = (entity) => {
            const index = this.rooms.findIndex(rm => rm.id === entity.id);
            this.rooms[index] = entity;
        };
        this.getUserRoom = (id) => this.rooms.find(room => room.users.find(user => user.id == id) !== null);
    }
};
RoomEntity = __decorate([
    common_1.Injectable({})
], RoomEntity);
exports.RoomEntity = RoomEntity;
//# sourceMappingURL=db.js.map