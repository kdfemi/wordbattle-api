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
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
const score_entity_1 = require("../score/score.entity");
const common_1 = require("@nestjs/common");
let Room = class Room extends typeorm_1.BaseEntity {
    generateOTP() {
        const string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let OTP = '';
        const stringLength = string.length;
        for (let i = 0; i < 6; i++) {
            OTP += string[Math.floor(Math.random() * stringLength)];
        }
        const log = new common_1.Logger('OTP');
        log.log(OTP);
        this.id = OTP;
    }
};
__decorate([
    typeorm_1.PrimaryColumn({ length: 6 }),
    __metadata("design:type", String)
], Room.prototype, "id", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", String)
], Room.prototype, "creatorId", void 0);
__decorate([
    typeorm_1.OneToMany(() => user_entity_1.User, user => user.room, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], Room.prototype, "users", void 0);
__decorate([
    typeorm_1.Column(),
    __metadata("design:type", Number)
], Room.prototype, "gameLength", void 0);
__decorate([
    typeorm_1.OneToMany(() => score_entity_1.Score, score => score.room, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], Room.prototype, "scores", void 0);
__decorate([
    typeorm_1.Column({ default: 0 }),
    __metadata("design:type", Number)
], Room.prototype, "played", void 0);
__decorate([
    typeorm_1.Column({ default: '' }),
    __metadata("design:type", String)
], Room.prototype, "currentWord", void 0);
__decorate([
    typeorm_1.BeforeInsert(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Room.prototype, "generateOTP", null);
Room = __decorate([
    typeorm_1.Entity()
], Room);
exports.Room = Room;
//# sourceMappingURL=Room.entity.js.map