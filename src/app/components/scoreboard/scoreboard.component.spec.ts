import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoreboardComponent } from './scoreboard.component';
import { ScoreboardService } from '../../services/scoreboard.service';

describe('ScoreboardComponent', () => {
  let component: ScoreboardComponent;
  let fixture: ComponentFixture<ScoreboardComponent>;
  let service: ScoreboardService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ScoreboardComponent],
      providers: [ScoreboardService]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreboardComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(ScoreboardService);
    if (service.soundEnabled()) {
      service.toggleSound();
    }
    fixture.detectChanges();
  });

  afterEach(() => {
    service.ngOnDestroy();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render default team names and 0 scores', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.home-team .team-name-text')?.textContent?.trim()).toBe('Equipa A');
    expect(compiled.querySelector('.away-team .team-name-text')?.textContent?.trim()).toBe('Equipa B');
    expect(compiled.querySelector('.home-score-number')?.textContent?.trim()).toBe('0');
    expect(compiled.querySelector('.away-score-number')?.textContent?.trim()).toBe('0');
  });

  it('should increment and decrement home score via UI clicks', () => {
    const homeIncBtn = fixture.nativeElement.querySelector('.home-inc') as HTMLButtonElement;
    const homeDecBtn = fixture.nativeElement.querySelector('.home-dec') as HTMLButtonElement;

    // Decrement should initially be disabled because score is 0
    expect(homeDecBtn.disabled).toBe(true);

    homeIncBtn.click();
    fixture.detectChanges();
    expect(component.homeScore()).toBe(1);
    expect(homeDecBtn.disabled).toBe(false);

    homeDecBtn.click();
    fixture.detectChanges();
    expect(component.homeScore()).toBe(0);
    expect(homeDecBtn.disabled).toBe(true);
  });

  it('should increment away score when away score number is clicked', () => {
    const awayScoreEl = fixture.nativeElement.querySelector('.away-score-number') as HTMLElement;
    awayScoreEl.click();
    fixture.detectChanges();
    expect(component.awayScore()).toBe(1);
  });

  it('should support inline editing of home team name', () => {
    component.startEditHome();
    fixture.detectChanges();
    expect(component.isEditingHome()).toBe(true);

    component.tempHomeName.set('Sporting CP');
    component.saveEditHome();
    fixture.detectChanges();

    expect(component.isEditingHome()).toBe(false);
    expect(service.homeTeam()).toBe('Sporting CP');
  });

  it('should toggle timer running state', () => {
    expect(component.isRunning()).toBe(false);
    component.onToggleTimer();
    expect(component.isRunning()).toBe(true);
    component.onToggleTimer();
    expect(component.isRunning()).toBe(false);
  });

  it('should handle match reset confirmation modal flow', () => {
    service.incrementHome();
    service.incrementAway();
    expect(component.homeScore()).toBe(1);
    expect(component.awayScore()).toBe(1);

    component.promptResetMatch();
    expect(component.showResetConfirm()).toBe(true);

    component.confirmResetMatch();
    expect(component.showResetConfirm()).toBe(false);
    expect(component.homeScore()).toBe(0);
    expect(component.awayScore()).toBe(0);
  });

  it('should handle keyboard shortcuts', () => {
    const spaceEvent = new KeyboardEvent('keydown', { code: 'Space' });
    window.dispatchEvent(spaceEvent);
    expect(service.isRunning()).toBe(true);

    const qEvent = new KeyboardEvent('keydown', { key: 'q' });
    window.dispatchEvent(qEvent);
    expect(service.homeScore()).toBe(1);

    const pEvent = new KeyboardEvent('keydown', { key: 'p' });
    window.dispatchEvent(pEvent);
    expect(service.awayScore()).toBe(1);

    const aEvent = new KeyboardEvent('keydown', { key: 'a' });
    window.dispatchEvent(aEvent);
    expect(service.homeScore()).toBe(0);
  });
});
