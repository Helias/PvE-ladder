export interface AchievementCategory {
  ID: number;
  Name: string;
  ParentID: number;
}

export interface Achievement {
  ID: number;
  Name: string;
  Description: string;
  Points: number;
  icon: string;
  Quantity: number;
}

export interface CharacterAchievement {
  achievement: number;
  date: number;
  counter?: number;
}

export interface AchievementProgress {
  achievement: number;
  counter: number;
}

/** Category IDs that are statistics rather than achievements */
export const STATS_CATEGORY_IDS = new Set([
  130, 141, 128, 122, 133, 14807, 132, 134, 131, 21, 123, 135, 140, 152, 178,
  14821, 124, 136, 145, 153, 173, 14822, 125, 137, 147, 154, 14823, 126, 191,
  14963, 127, 15021, 15062,
]);
