import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlayerContextService } from '../../services/player-context.service';

@Component({
  selector: 'app-player-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './player-header.html',
  styleUrl: './player-header.css',
})
export class PlayerHeader {
  private readonly playerContext = inject(PlayerContextService);

  readonly character = this.playerContext.character;
  readonly faction = this.playerContext.faction;
}
