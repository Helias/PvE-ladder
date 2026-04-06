export type Faction = 'alliance' | 'horde';

export interface CharacterRank {
  guid: number;
  name: string;
  race: number;
  class: number;
  level: number;
  achievement_points: number;
  gender: number;
  faction: Faction;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Character {
  guid: number;
  name: string;
  race: number;
  class: number;
  level: number;
  gender: number;
  guildName?: string;
}

const ALLIANCE_RACES = new Set([1, 3, 4, 7, 11]);

export function getFaction(raceId: number): Faction {
  return ALLIANCE_RACES.has(raceId) ? 'alliance' : 'horde';
}
