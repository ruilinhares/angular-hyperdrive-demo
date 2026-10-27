import { Injectable, signal, computed, effect, OnDestroy } from '@angular/core';

export interface MatchEvent {
  id: string;
  timeFormatted: string;
  type: 'goal-home' | 'goal-away' | 'period' | 'reset';
  description: string;
  timestamp: Date;
}

export type MatchPeriod = '1ª Parte' | 'Intervalo' | '2ª Parte' | 'Prolongamento' | 'Fim de Jogo';

@Injectable({
  providedIn: 'root'
})
export class ScoreboardService implements OnDestroy {
  // Team Information
  readonly homeTeam = signal<string>('Equipa A');
  readonly awayTeam = signal<string>('Equipa B');

  // Scores
  readonly homeScore = signal<number>(0);
  readonly awayScore = signal<number>(0);

  // Match Timer
  readonly totalSeconds = signal<number>(0);
  readonly isRunning = signal<boolean>(false);

  // Match Status
  readonly period = signal<MatchPeriod>('1ª Parte');
  readonly periods: MatchPeriod[] = [
    '1ª Parte',
    'Intervalo',
    '2ª Parte',
    'Prolongamento',
    'Fim de Jogo'
  ];

  // Match Events History
  readonly events = signal<MatchEvent[]>([]);

  // Sound enabled
  readonly soundEnabled = signal<boolean>(true);

  private timerIntervalId: ReturnType<typeof setInterval> | null = null;
  private audioCtx: AudioContext | null = null;

  // Computed signals
  readonly formattedMinutes = computed(() => {
    const mins = Math.floor(this.totalSeconds() / 60);
    return mins.toString().padStart(2, '0');
  });

  readonly formattedSeconds = computed(() => {
    const secs = this.totalSeconds() % 60;
    return secs.toString().padStart(2, '0');
  });

  readonly formattedTime = computed(() => {
    return `${this.formattedMinutes()}:${this.formattedSeconds()}`;
  });

  readonly leadingTeam = computed(() => {
    const home = this.homeScore();
    const away = this.awayScore();
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
  });

  readonly scoreDifference = computed(() => {
    return Math.abs(this.homeScore() - this.awayScore());
  });

  constructor() {
    // Optional persistence to sessionStorage or localStorage
    this.restoreFromStorage();

    // Auto-save on signal changes
    effect(() => {
      this.saveToStorage();
    });
  }

  ngOnDestroy(): void {
    this.stopTimerInterval();
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch {
        // ignore
      }
    }
  }

  // --- Team Management ---

  setHomeTeam(name: string): void {
    const cleanName = name.trim() || 'Equipa A';
    this.homeTeam.set(cleanName);
  }

  setAwayTeam(name: string): void {
    const cleanName = name.trim() || 'Equipa B';
    this.awayTeam.set(cleanName);
  }

  swapTeams(): void {
    const tempName = this.homeTeam();
    const tempScore = this.homeScore();

    this.homeTeam.set(this.awayTeam());
    this.homeScore.set(this.awayScore());

    this.awayTeam.set(tempName);
    this.awayScore.set(tempScore);

    this.addEvent('period', `Lados trocados: ${this.homeTeam()} vs ${this.awayTeam()}`);
    this.playTone(440, 0.1);
  }

  // --- Score Controls ---

  incrementHome(delta = 1): void {
    const next = this.homeScore() + delta;
    this.homeScore.set(next);
    this.addEvent('goal-home', `Golo! ${this.homeTeam()} (${next} - ${this.awayScore()})`);
    this.playGoalWhistle();
  }

  decrementHome(delta = 1): void {
    const current = this.homeScore();
    const next = Math.max(0, current - delta);
    if (current !== next) {
      this.homeScore.set(next);
      this.playTone(330, 0.1);
    }
  }

  incrementAway(delta = 1): void {
    const next = this.awayScore() + delta;
    this.awayScore.set(next);
    this.addEvent('goal-away', `Golo! ${this.awayTeam()} (${this.homeScore()} - ${next})`);
    this.playGoalWhistle();
  }

  decrementAway(delta = 1): void {
    const current = this.awayScore();
    const next = Math.max(0, current - delta);
    if (current !== next) {
      this.awayScore.set(next);
      this.playTone(330, 0.1);
    }
  }

  setHomeScore(value: number): void {
    this.homeScore.set(Math.max(0, Math.floor(value)));
  }

  setAwayScore(value: number): void {
    this.awayScore.set(Math.max(0, Math.floor(value)));
  }

  // --- Timer Controls ---

  startTimer(): void {
    if (this.isRunning()) return;

    this.isRunning.set(true);
    this.playTone(880, 0.15);

    this.timerIntervalId = setInterval(() => {
      this.totalSeconds.update(s => s + 1);
    }, 1000);
  }

  pauseTimer(): void {
    if (!this.isRunning()) return;

    this.stopTimerInterval();
    this.isRunning.set(false);
    this.playTone(587.33, 0.15);
  }

  toggleTimer(): void {
    if (this.isRunning()) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  resetTimer(): void {
    this.stopTimerInterval();
    this.isRunning.set(false);
    this.totalSeconds.set(0);
    this.playTone(392, 0.15);
  }

  adjustTime(secondsDelta: number): void {
    this.totalSeconds.update(s => Math.max(0, s + secondsDelta));
    this.playTone(520, 0.08);
  }

  setTime(minutes: number, seconds: number = 0): void {
    const total = Math.max(0, minutes * 60 + seconds);
    this.totalSeconds.set(total);
  }

  setPeriod(newPeriod: MatchPeriod): void {
    this.period.set(newPeriod);
    this.addEvent('period', `Período alterado: ${newPeriod}`);
    this.playWhistleLong();
  }

  nextPeriod(): void {
    const idx = this.periods.indexOf(this.period());
    if (idx >= 0 && idx < this.periods.length - 1) {
      this.setPeriod(this.periods[idx + 1]);
    }
  }

  // --- Reset Match ---

  resetMatch(): void {
    this.stopTimerInterval();
    this.isRunning.set(false);
    this.homeScore.set(0);
    this.awayScore.set(0);
    this.totalSeconds.set(0);
    this.period.set('1ª Parte');
    this.events.set([]);
    this.clearStorage();
    this.playTone(261.63, 0.25);
  }

  toggleSound(): void {
    this.soundEnabled.update(s => !s);
  }

  // --- Event Timeline ---

  private addEvent(type: MatchEvent['type'], description: string): void {
    const newEvent: MatchEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timeFormatted: this.formattedTime(),
      type,
      description,
      timestamp: new Date()
    };
    this.events.update(list => [newEvent, ...list.slice(0, 49)]); // keep last 50 events
  }

  clearEvents(): void {
    this.events.set([]);
  }

  // --- Web Audio Synthetic Sound Effects ---

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.soundEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio might be blocked until user gesture, safe to ignore
    }
  }

  private playGoalWhistle(): void {
    if (!this.soundEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      // High pitch two-chirp whistle
      const now = ctx.currentTime;
      [0, 0.18].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2400, now + delay);
        osc.frequency.linearRampToValueAtTime(3200, now + delay + 0.08);
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
    } catch {
      // Audio context error ignore
    }
  }

  private playWhistleLong(): void {
    if (!this.soundEnabled()) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.linearRampToValueAtTime(2200, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }

  private stopTimerInterval(): void {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  // --- LocalStorage persistence for user convenience ---

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const state = {
        homeTeam: this.homeTeam(),
        awayTeam: this.awayTeam(),
        homeScore: this.homeScore(),
        awayScore: this.awayScore(),
        totalSeconds: this.totalSeconds(),
        period: this.period(),
        soundEnabled: this.soundEnabled()
      };
      localStorage.setItem('omarcador_state', JSON.stringify(state));
    } catch {
      // ignore storage quota/exceptions
    }
  }

  private restoreFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem('omarcador_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.homeTeam) this.homeTeam.set(parsed.homeTeam);
        if (parsed.awayTeam) this.awayTeam.set(parsed.awayTeam);
        if (typeof parsed.homeScore === 'number') this.homeScore.set(parsed.homeScore);
        if (typeof parsed.awayScore === 'number') this.awayScore.set(parsed.awayScore);
        if (typeof parsed.totalSeconds === 'number') this.totalSeconds.set(parsed.totalSeconds);
        if (parsed.period) this.period.set(parsed.period);
        if (typeof parsed.soundEnabled === 'boolean') this.soundEnabled.set(parsed.soundEnabled);
      }
    } catch {
      // ignore JSON parse error
    }
  }

  private clearStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.removeItem('omarcador_state');
    } catch {
      // ignore
    }
  }
}
