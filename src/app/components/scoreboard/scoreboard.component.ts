import {
  Component,
  inject,
  signal,
  HostListener,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScoreboardService, MatchPeriod } from '../../services/scoreboard.service';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.scss']
})
export class ScoreboardComponent {
  readonly scoreboardService = inject(ScoreboardService);

  // Quick references to service signals
  readonly homeTeam = this.scoreboardService.homeTeam;
  readonly awayTeam = this.scoreboardService.awayTeam;
  readonly homeScore = this.scoreboardService.homeScore;
  readonly awayScore = this.scoreboardService.awayScore;
  readonly formattedTime = this.scoreboardService.formattedTime;
  readonly isRunning = this.scoreboardService.isRunning;
  readonly period = this.scoreboardService.period;
  readonly periods = this.scoreboardService.periods;
  readonly events = this.scoreboardService.events;
  readonly soundEnabled = this.scoreboardService.soundEnabled;

  // Editing state for Team Names
  readonly isEditingHome = signal<boolean>(false);
  readonly isEditingAway = signal<boolean>(false);
  readonly tempHomeName = signal<string>('');
  readonly tempAwayName = signal<string>('');

  // Confirmation modal state for Match Reset
  readonly showResetConfirm = signal<boolean>(false);
  readonly showShortcutsModal = signal<boolean>(false);

  @ViewChild('homeInput') homeInputElement?: ElementRef<HTMLInputElement>;
  @ViewChild('awayInput') awayInputElement?: ElementRef<HTMLInputElement>;

  // --- Keyboard Shortcuts ---
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Ignore keyboard shortcuts if the user is typing in an input
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    if (event.code === 'Space') {
      event.preventDefault();
      this.scoreboardService.toggleTimer();
    } else if (event.key === 'q' || event.key === 'Q') {
      this.scoreboardService.incrementHome();
    } else if (event.key === 'a' || event.key === 'A') {
      this.scoreboardService.decrementHome();
    } else if (event.key === 'p' || event.key === 'P') {
      this.scoreboardService.incrementAway();
    } else if (event.key === 'l' || event.key === 'L') {
      this.scoreboardService.decrementAway();
    } else if (event.key === 'r' || event.key === 'R') {
      this.scoreboardService.resetTimer();
    }
  }

  // --- Inline Team Name Editing ---

  startEditHome(): void {
    this.tempHomeName.set(this.homeTeam());
    this.isEditingHome.set(true);
    setTimeout(() => {
      this.homeInputElement?.nativeElement.focus();
      this.homeInputElement?.nativeElement.select();
    }, 50);
  }

  saveEditHome(): void {
    if (!this.isEditingHome()) return;
    this.scoreboardService.setHomeTeam(this.tempHomeName());
    this.isEditingHome.set(false);
  }

  cancelEditHome(): void {
    this.isEditingHome.set(false);
  }

  startEditAway(): void {
    this.tempAwayName.set(this.awayTeam());
    this.isEditingAway.set(true);
    setTimeout(() => {
      this.awayInputElement?.nativeElement.focus();
      this.awayInputElement?.nativeElement.select();
    }, 50);
  }

  saveEditAway(): void {
    if (!this.isEditingAway()) return;
    this.scoreboardService.setAwayTeam(this.tempAwayName());
    this.isEditingAway.set(false);
  }

  cancelEditAway(): void {
    this.isEditingAway.set(false);
  }

  // --- Actions ---

  onIncrementHome(): void {
    this.scoreboardService.incrementHome();
  }

  onDecrementHome(): void {
    this.scoreboardService.decrementHome();
  }

  onIncrementAway(): void {
    this.scoreboardService.incrementAway();
  }

  onDecrementAway(): void {
    this.scoreboardService.decrementAway();
  }

  onToggleTimer(): void {
    this.scoreboardService.toggleTimer();
  }

  onResetTimer(): void {
    this.scoreboardService.resetTimer();
  }

  onAdjustTime(deltaSeconds: number): void {
    this.scoreboardService.adjustTime(deltaSeconds);
  }

  onSetPeriod(p: MatchPeriod): void {
    this.scoreboardService.setPeriod(p);
  }

  onSwapTeams(): void {
    this.scoreboardService.swapTeams();
  }

  promptResetMatch(): void {
    this.showResetConfirm.set(true);
  }

  confirmResetMatch(): void {
    this.scoreboardService.resetMatch();
    this.showResetConfirm.set(false);
  }

  cancelResetMatch(): void {
    this.showResetConfirm.set(false);
  }

  toggleShortcutsModal(): void {
    this.showShortcutsModal.update(v => !v);
  }

  toggleSound(): void {
    this.scoreboardService.toggleSound();
  }
}
