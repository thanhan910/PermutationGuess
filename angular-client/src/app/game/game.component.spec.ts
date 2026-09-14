import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GameComponent] }).compileComponents();
    fixture = TestBed.createComponent(GameComponent);
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

  function useFiveGuesses() {
    for (let guess = 0; guess < 5; guess++) submitGuess();
    expect(page.textContent).toContain('1 guess left.');
    expect(page.textContent).not.toContain('Game over!');
  }

  it('starts with six guesses and records feedback after a guess', () => {
    expect(page.textContent).toContain('6 guesses left.');
    submitGuess();
    expect(component.guesses.length).toBe(1);
    expect(page.textContent).toContain('Guess #1:');
    expect(page.textContent).toContain('Correct: 0');
    expect(page.textContent).toContain('5 guesses left.');
  });

  it('shows only success when the sixth guess is correct', () => {
    useFiveGuesses();
    component.items = [...component.correctGuess];
    submitGuess();
    expect(page.textContent).toContain('You guessed correctly!');
    expect(page.textContent).not.toContain('Game over!');
    expect(component.guesses.length).toBe(6);
    expect(page.querySelector('#submitGuess')).toBeNull();
    component.submit();
    expect(component.guesses.length).toBe(6);
  });

  it('shows game over when the sixth guess is incorrect', () => {
    useFiveGuesses();
    submitGuess();
    expect(page.textContent).toContain('Game over!');
    expect(page.textContent).not.toContain('You guessed correctly!');
    expect(page.querySelector('#submitGuess')).toBeNull();
    component.submit();
    expect(component.guesses.length).toBe(6);
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
      useFiveGuesses();
      if (win) component.items = [...component.correctGuess];
      submitGuess();
      page.querySelector<HTMLButtonElement>('#resetButton')!.click();
      fixture.detectChanges();
      expect(component.guesses).toEqual([]);
      expect(component.correctCount).toBe(0);
      expect(component.items).toEqual(Object.keys(component.itemColors));
      expect([...component.correctGuess].sort()).toEqual([...component.items].sort());
      expect(page.textContent).toContain('6 guesses left.');
      expect(page.textContent).not.toContain('You guessed correctly!');
      expect(page.textContent).not.toContain('Game over!');
      expect(page.querySelector('#submitGuess')).not.toBeNull();
    });
  }
});
