import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { DEFAULT_PUZZLE_SIZE, PUZZLE_SIZES } from './puzzle';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
    expect(app.size).toBe(DEFAULT_PUZZLE_SIZE);
  });

  it('should render the game for the size in the URL', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-game h2')?.textContent).toContain('Permutation Guessing Game');
    expect(compiled.querySelectorAll('app-game .game-box').length).toBe(DEFAULT_PUZZLE_SIZE);
    expect(TestBed.inject(Title).getTitle()).toContain(`${DEFAULT_PUZZLE_SIZE} items`);
  });

  it('should link to every size relative to the deployment base', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.size-link'),
    );
    expect(links.map((link) => link.textContent?.trim())).toEqual(PUZZLE_SIZES.map(String));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(PUZZLE_SIZES.map((size) => `${size}/`));
    expect(links.filter((link) => link.getAttribute('aria-current') === 'page')).toHaveLength(1);
    expect(links.find((link) => link.classList.contains('is-current'))?.textContent?.trim()).toBe(
      String(DEFAULT_PUZZLE_SIZE),
    );
  });
});
