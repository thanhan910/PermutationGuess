import { Component } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

/**
 * @title Drag&Drop horizontal sorting
 */

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CommonModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.css'
})

export class ExampleComponent {

    itemColors : { [key: string]: string } = {
        "Apple": "red",
        "Banana": "#ffd700",
        "Grape": "purple",
        "Orange": "orange",
        "Pear": "#d1e231",
    }

    maxGuesses = 8;

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
        if (this.guesses.length >= this.maxGuesses) {
            this.gameOver = true;
            return;
        }
    }
}
