import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Achievement, AchievementCategory, AchievementProgress, CharacterAchievement } from '../models/achievement';
import { Character, CharacterRank, PaginatedResponse } from '../models/character';

@Injectable({ providedIn: 'root' })
export class PveApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl + 'characters/';

  /** Get characters ranked by achievement points (paginated) */
  getCharacterAchievements(page = 1, limit = 25): Observable<PaginatedResponse<CharacterRank>> {
    return this.http.get<PaginatedResponse<CharacterRank>>(
      `${this.baseUrl}character_achievement?page=${page}&limit=${limit}`
    );
  }

  /** Get a single character by ID */
  getCharacter(id: number): Observable<Character> {
    return this.http.get<Character>(`${this.baseUrl}${id}`);
  }

  /** Get all achievement categories */
  getAchievementCategories(): Observable<AchievementCategory[]> {
    return this.http.get<AchievementCategory[]>(`${this.baseUrl}achievement_category`);
  }

  /** Get a single achievement category by ID */
  getAchievementCategory(id: number): Observable<AchievementCategory> {
    return this.http.get<AchievementCategory>(`${this.baseUrl}achievement_category/${id}`);
  }

  /** Get character achievements for a specific category */
  getCharacterAchievementsByCategory(characterId: number, categoryId: number): Observable<CharacterAchievement[]> {
    return this.http.get<CharacterAchievement[]>(
      `${this.baseUrl}character_achievement/${characterId}?category=${categoryId}`
    );
  }

  /** Get all achievements in a category, optionally filtered by faction */
  getAchievementsByCategory(categoryId: number, faction?: string): Observable<Achievement[]> {
    const factionParam = faction ? `&faction=${faction}` : '';
    return this.http.get<Achievement[]>(
      `${this.baseUrl}achievement?category=${categoryId}${factionParam}`
    );
  }

  /** Get achievement progress (statistics counters) for a character in a category */
  getAchievementProgress(characterId: number, categoryId: number): Observable<AchievementProgress[]> {
    return this.http.get<AchievementProgress[]>(
      `${this.baseUrl}achievement_progress?guid=${characterId}&category=${categoryId}`
    );
  }
}
