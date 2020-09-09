import { Injectable } from '@nestjs/common';
import {words} from '../words';

@Injectable()
export class GameService {
  private readonly alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  // tslint:disable-next-line: variable-name
  private readonly Minimum_Generated = 3;
  private readonly filteredWords = words.filter((word) => word.length >= 2  && word.length <= 6);



  private generateRandomNumber (min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateWord () {

    const suggestedWordId = this.generateRandomNumber(0, this.filteredWords.length);
    return  this.filteredWords[suggestedWordId];
  }

  private shuffleArray(array: any[]) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async generateGameWord() {
      const word = this.generateWord();
      if (typeof word === 'undefined' || !word) {
        return await this.generateGameWord();
      }

      const fillingLetter: string[] = word.split('');
      let scrambledWord: string[] = [];

      const hiddenLetters: string[] = [];
      const hiddenLettersIndex: number[] = [];

      const numberOfLettersToHide = this.generateRandomNumber(this.Minimum_Generated, word.length - this.Minimum_Generated);
      const lettersToHide = new Map<number, string>();

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

}
