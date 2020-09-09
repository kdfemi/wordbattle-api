"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const words_1 = require("../words");
let GameService = class GameService {
    constructor() {
        this.alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        this.Minimum_Generated = 3;
        this.filteredWords = words_1.words.filter((word) => word.length <= 6);
    }
    generateRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    generateWord() {
        return this.filteredWords[this.generateRandomNumber(0, this.filteredWords.length)];
    }
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    generateGameWord() {
        const word = this.generateWord();
        if (typeof word === 'undefined' || !word) {
            return this.generateGameWord();
        }
        const fillingLetter = word.split('');
        let scrambledWord = [];
        const hiddenLetters = [];
        const hiddenLettersIndex = [];
        const numberOfLettersToHide = this.generateRandomNumber(this.Minimum_Generated, word.length - this.Minimum_Generated);
        const lettersToHide = new Map();
        while (lettersToHide.size !== numberOfLettersToHide) {
            const indexToHide = this.generateRandomNumber(0, numberOfLettersToHide + 1);
            if (!lettersToHide.has(indexToHide)) {
                const letter = word[indexToHide];
                lettersToHide.set(indexToHide, letter);
            }
        }
        lettersToHide.forEach((value, key) => {
            hiddenLetters.push(value);
            hiddenLettersIndex.push(key);
        });
        fillingLetter.forEach((value, index) => {
            if (hiddenLettersIndex.indexOf(index) >= 0) {
                fillingLetter[index] = '';
            }
        });
        scrambledWord.push(...hiddenLetters);
        while (!(scrambledWord.length === word.length)) {
            const salt = this.generateRandomNumber(0, 25);
            if (this.alphabet[salt]) {
                scrambledWord.push(this.alphabet[salt]);
            }
        }
        scrambledWord = this.shuffleArray(scrambledWord);
        return {
            word,
            scrambledWord,
            fillingLetter,
        };
    }
};
GameService = __decorate([
    common_1.Injectable()
], GameService);
exports.GameService = GameService;
//# sourceMappingURL=game.service.js.map