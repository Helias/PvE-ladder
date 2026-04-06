import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { getFaction } from '../../models/character';
import { AchievementCategory, STATS_CATEGORY_IDS } from '../../models/achievement';
import { PveApiService } from '../../services/pve-api.service';
import { PlayerContextService } from '../../services/player-context.service';
import { CategoryNav, CategoryNode } from './category-nav/category-nav';

@Component({
  selector: 'app-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, CategoryNav],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class Player implements OnInit, OnDestroy {
  private readonly api = inject(PveApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly playerContext = inject(PlayerContextService);

  readonly character = this.playerContext.character;
  readonly faction = this.playerContext.faction;
  readonly categoryTree = signal<CategoryNode[]>([]);
  readonly currentCategoryId = signal<number | null>(null);
  readonly sidebarOpen = signal(false);

  readonly characterId = computed(() => {
    const char = this.character();
    return char?.guid ?? 0;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      character: this.api.getCharacter(id),
      categories: this.api.getAchievementCategories(),
    }).subscribe(({ character, categories }) => {
      this.character.set(character);
      this.faction.set(getFaction(character.race));
      this.categoryTree.set(this.buildCategoryTree(categories));

      // Auto-navigate to "General" (ID 92) like the original
      this.selectCategory(92);
    });
  }

  private buildCategoryTree(categories: AchievementCategory[]): CategoryNode[] {
    const parents = categories.filter((c) => c.ParentID === -1);
    return parents.map((parent) => ({
      id: parent.ID,
      name: parent.Name,
      children: categories
        .filter((c) => c.ParentID === parent.ID)
        .map((child) => ({
          id: child.ID,
          name: child.Name,
          children: categories
            .filter((c) => c.ParentID === child.ID)
            .map((sub) => ({
              id: sub.ID,
              name: sub.Name,
              children: [],
            })),
        })),
    }));
  }

  onCategorySelected(catId: number): void {
    this.selectCategory(catId);
  }

  selectCategory(catId: number): void {
    this.currentCategoryId.set(catId);
    this.sidebarOpen.set(false);

    const characterId = this.character()?.guid;
    if (!characterId) return;

    if (STATS_CATEGORY_IDS.has(catId)) {
      this.router.navigate(['stats', catId], { relativeTo: this.route });
    } else {
      this.router.navigate(['ach', catId], { relativeTo: this.route });
    }
  }

  ngOnDestroy(): void {
    this.playerContext.character.set(null);
    this.playerContext.faction.set('alliance');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
