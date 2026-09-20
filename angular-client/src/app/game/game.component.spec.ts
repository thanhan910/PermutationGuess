import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';
import { MAX_GUESSES, PUZZLE_SIZES, itemsForSize } from '../puzzle';

describe('GameComponent', () => {
  for (const size of PUZZLE_SIZES) {
    describe(`with ${size} items`, () => {
      const maxGuesses = MAX_GUESSES[size];
      let component: GameComponent;
      let fixture: ComponentFixture<GameComponent>;
      let page: HTMLElement;

      beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [GameComponent] }).compileComponents();
        fixture = TestBed.createComponent(GameComponent);
        fixture.componentRef.setInput('size', size);
        component = fixture.componentInstance;
        // A deterministic answer with no positions matching the starting order.
        component.correctGuess = [...component.items.slice(1), component.items[0]];
        page = fixture.nativeElement;
        fixture.detectChanges();
      });

      function submitGuess() {
        page.querySelector<HTMLButtonElement>('#submitGuess')!.click();
        fixture.detectChanges();
      }

      function useAllButOneGuess() {
        for (let guess = 0; guess < maxGuesses - 1; guess++) submitGuess();
        expect(page.textContent).toContain('1 guess left.');
        expect(page.textContent).not.toContain('Game over!');
      }

      it('plays with the items and guess budget of its size', () => {
        expect(component.items).toEqual(itemsForSize(size));
        expect(page.querySelectorAll('.game-box').length).toBe(size);
        expect(page.textContent).toContain(`the ${size} items`);
        expect(page.textContent).toContain(`${maxGuesses} guesses left.`);
      });

      it('records feedback after a guess', () => {
        submitGuess();
        expect(component.guesses.length).toBe(1);
        expect(page.textContent).toContain('Guess #1:');
        expect(page.textContent).toContain('Correct: 0');
        expect(page.textContent).toContain(`${maxGuesses - 1} guesses left.`);
      });

      it('shows only success when the last guess is correct', () => {
        useAllButOneGuess();
        component.items = [...component.correctGuess];
        submitGuess();
        expect(page.textContent).toContain('You guessed correctly!');
        expect(page.textContent).not.toContain('Game over!');
        expect(component.guesses.length).toBe(maxGuesses);
        expect(page.querySelector('#submitGuess')).toBeNull();
        component.submit();
        expect(component.guesses.length).toBe(maxGuesses);
      });

      it('shows game over when the last guess is incorrect', () => {
        useAllButOneGuess();
        submitGuess();
        expect(page.textContent).toContain('Game over!');
        expect(page.textContent).not.toContain('You guessed correctly!');
        expect(page.querySelector('#submitGuess')).toBeNull();
        component.submit();
        expect(component.guesses.length).toBe(maxGuesses);
      });

      it('ends the game after an early correct guess', () => {
        component.items = [...component.correctGuess];
        submitGuess();
        expect(page.textContent).toContain('You guessed correctly!');
        expect(page.textContent).not.toContain('Game over!');
        expect(page.querySelector('#submitGuess')).toBeNull();
        component.submit();
        expect(component.guesses.length).toBe(1);
      });

      for (const win of [true, false]) {
        it(`resets the game after a ${win ? 'win' : 'loss'}`, () => {
          useAllButOneGuess();
          if (win) component.items = [...component.correctGuess];
          submitGuess();
          page.querySelector<HTMLButtonElement>('#resetButton')!.click();
          fixture.detectChanges();
          expect(component.guesses).toEqual([]);
          expect(component.correctCount).toBe(0);
          expect(component.items).toEqual(itemsForSize(size));
          expect([...component.correctGuess].sort()).toEqual([...component.items].sort());
          expect(page.textContent).toContain(`${maxGuesses} guesses left.`);
          expect(page.textContent).not.toContain('You guessed correctly!');
          expect(page.textContent).not.toContain('Game over!');
          expect(page.querySelector('#submitGuess')).not.toBeNull();
        });
      }
    });
  }
});
