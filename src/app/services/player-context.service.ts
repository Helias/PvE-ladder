import { Injectable, signal } from '@angular/core';
import { Character, Faction } from '../models/character';

@Injectable({ providedIn: 'root' })
export class PlayerContextService {
  readonly character = signal<Character | null>(null);
  readonly faction = signal<Faction>('alliance');
}
