import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  DEFAULT_PUZZLE_SIZE,
  ITEM_COLORS,
  MAX_GUESSES,
  PuzzleSize,
  itemsForSize,
  shuffle,
} from '../puzzle';

@Component({
  selector: 'app-game',
  imports: [CdkDropList, CdkDrag],
  templateUrl: './game.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './game.component.css'
})

export class GameComponent {

    readonly itemColors: { [key: string]: string } = ITEM_COLORS;

    private currentSize: PuzzleSize = DEFAULT_PUZZLE_SIZE;

    /** How many items this board plays with. Changing it starts a new game. */
    @Input()
    set size(value: PuzzleSize) {
        this.currentSize = value;
        this.reset();
    }

    get size(): PuzzleSize {
        return this.currentSize;
    }

    get maxGuesses(): number {
        return MAX_GUESSES[this.currentSize];
    }

    guessedCorrectly = false;

    gameOver = false;

    items = itemsForSize(DEFAULT_PUZZLE_SIZE);

    correctGuess = shuffle(itemsForSize(DEFAULT_PUZZLE_SIZE));

    guesses : string[] = [];

    correctCount = 0;

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.items, event.previousIndex, event.currentIndex);
    }

    reset() {
        this.guesses = [];
        this.items = itemsForSize(this.currentSize);
        this.correctGuess = shuffle(this.items);
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
