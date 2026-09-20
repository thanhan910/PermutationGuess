import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { GameComponent } from './game/game.component';
import { MAX_GUESSES, PUZZLE_SIZES, PuzzleSize, resolvePuzzleSize } from './puzzle';

@Component({
  selector: 'app-root',
  imports: [GameComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly sizes = PUZZLE_SIZES;

  /** Each size is its own page, so the URL alone decides which board to show. */
  readonly size: PuzzleSize = resolvePuzzleSize(location.pathname, document.baseURI);

  constructor() {
    inject(Title).setTitle(`${this.size} items - Permutation Guessing Game`);
  }

  guessesFor(size: PuzzleSize): number {
    return MAX_GUESSES[size];
  }
}
