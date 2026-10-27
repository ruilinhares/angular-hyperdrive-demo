import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ScoreboardService } from './scoreboard.service';

describe('ScoreboardService', () => {
  let service: ScoreboardService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ScoreboardService]
    });
    service = TestBed.inject(ScoreboardService);
    // Ensure muted for tests to avoid web audio warnings
    if (service.soundEnabled()) {
      service.toggleSound();
    }
  });

  afterEach(() => {
    service.ngOnDestroy();
    localStorage.clear();
  });

  it('should be created with default values', () => {
    expect(service).toBeTruthy();
    expect(service.homeTeam()).toBe('Equipa A');
    expect(service.awayTeam()).toBe('Equipa B');
    expect(service.homeScore()).toBe(0);
    expect(service.awayScore()).toBe(0);
    expect(service.totalSeconds()).toBe(0);
    expect(service.formattedTime()).toBe('00:00');
    expect(service.isRunning()).toBe(false);
    expect(service.period()).toBe('1ª Parte');
  });

  it('should update team names properly', () => {
    service.setHomeTeam('FC Porto');
    service.setAwayTeam('SL Benfica');
    expect(service.homeTeam()).toBe('FC Porto');
    expect(service.awayTeam()).toBe('SL Benfica');

    // Empty names fallback to defaults
    service.setHomeTeam('   ');
    expect(service.homeTeam()).toBe('Equipa A');
  });

  it('should increment and decrement home score without dropping below 0', () => {
    service.incrementHome();
    expect(service.homeScore()).toBe(1);

    service.incrementHome(2);
    expect(service.homeScore()).toBe(3);

    service.decrementHome(1);
    expect(service.homeScore()).toBe(2);

    service.decrementHome(5);
    expect(service.homeScore()).toBe(0); // Clamped at 0
  });

  it('should increment and decrement away score without dropping below 0', () => {
    service.incrementAway();
    expect(service.awayScore()).toBe(1);

    service.decrementAway(1);
    expect(service.awayScore()).toBe(0);

    service.decrementAway(1);
    expect(service.awayScore()).toBe(0); // Clamped at 0
  });

  it('should format time correctly MM:SS', () => {
    service.setTime(0, 5);
    expect(service.formattedTime()).toBe('00:05');

    service.setTime(12, 45);
    expect(service.formattedTime()).toBe('12:45');

    service.setTime(90, 0);
    expect(service.formattedTime()).toBe('90:00');
  });

  it('should control timer lifecycle (start, pause, reset)', () => {
    vi.useFakeTimers();
    try {
      expect(service.isRunning()).toBe(false);

      service.startTimer();
      expect(service.isRunning()).toBe(true);

      vi.advanceTimersByTime(3000);
      expect(service.totalSeconds()).toBe(3);
      expect(service.formattedTime()).toBe('00:03');

      service.pauseTimer();
      expect(service.isRunning()).toBe(false);

      vi.advanceTimersByTime(2000);
      expect(service.totalSeconds()).toBe(3); // Paused, does not change

      service.toggleTimer();
      expect(service.isRunning()).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(service.totalSeconds()).toBe(4);

      service.resetTimer();
      expect(service.isRunning()).toBe(false);
      expect(service.totalSeconds()).toBe(0);
      expect(service.formattedTime()).toBe('00:00');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should swap teams and their scores', () => {
    service.setHomeTeam('Sporting CP');
    service.setAwayTeam('SC Braga');
    service.setHomeScore(2);
    service.setAwayScore(1);

    service.swapTeams();

    expect(service.homeTeam()).toBe('SC Braga');
    expect(service.awayTeam()).toBe('Sporting CP');
    expect(service.homeScore()).toBe(1);
    expect(service.awayScore()).toBe(2);
  });

  it('should reset entire match', () => {
    service.setHomeScore(3);
    service.setAwayScore(2);
    service.setTime(45, 0);
    service.startTimer();
    service.setPeriod('Intervalo');

    service.resetMatch();

    expect(service.homeScore()).toBe(0);
    expect(service.awayScore()).toBe(0);
    expect(service.totalSeconds()).toBe(0);
    expect(service.isRunning()).toBe(false);
    expect(service.period()).toBe('1ª Parte');
    expect(service.events().length).toBe(0);
  });
});
