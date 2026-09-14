import { Component } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css'
})

export class GameComponent {

    itemColors : { [key: string]: string } = {
        "Apple": "red",
        "Banana": "#ffd700",
        "Grape": "purple",
        "Orange": "orange",
        "Pear": "#d1e231",
    }

    readonly maxGuesses = 6;

    guessedCorrectly = false;

    gameOver = false;

    items = Object.keys(this.itemColors);

    correctGuess = Object.keys(this.itemColors).sort(() => Math.random() - 0.5);

    guesses : string[] = [];

    correctCount = 0;

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    }

    reset() {
        this.guesses = [];
        this.items = Object.keys(this.itemColors);
        this.correctGuess = Object.keys(this.itemColors).sort(() => Math.random() - 0.5);
        this.guessedCorrectly = false;
        this.gameOver = false;
        this.correctCount = 0;
    }

    submit() {
        if (this.gameOver || this.guessedCorrectly) {
            return;
        }
        this.correctCount = 0;
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i] === this.correctGuess[i]) {
                this.correctCount++;
            }
        }
        if (this.correctCount === this.items.length) {
            this.guessedCorrectly = true;
        }
        this.guesses.push(`Guess #${this.guesses.length + 1}: ${this.items.join(', ')} - Correct: ${this.correctCount}`);
        if (!this.guessedCorrectly && this.guesses.length >= this.maxGuesses) {
            this.gameOver = true;
            return;
        }
    }
}
