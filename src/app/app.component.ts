import { Component, signal, HostListener } from '@angular/core';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ScoreboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class App {
  readonly title = signal('O Marcador');
  readonly isFullscreen = signal<boolean>(false);

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Fullscreen request might fail if not supported or blocked
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}
