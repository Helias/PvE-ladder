import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Character, Faction, getFaction } from '../../models/character';
import { AchievementCategory, STATS_CATEGORY_IDS } from '../../models/achievement';
import { PveApiService } from '../../services/pve-api.service';

interface CategoryNode {
  id: number;
  name: string;
  children: CategoryNode[];
}

@Component({
  selector: 'app-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, NgTemplateOutlet],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class Player implements OnInit {
  private readonly api = inject(PveApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly character = signal<Character | null>(null);
  readonly faction = signal<Faction>('alliance');
  readonly categoryTree = signal<CategoryNode[]>([]);
  readonly currentCategoryId = signal<number | null>(null);
  readonly expandedParents = signal<Set<number>>(new Set());
  readonly expandedStatistics = signal<Set<number>>(new Set());
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

  toggleParent(parent: CategoryNode): void {
    // If the parent has no children, navigate directly (e.g., "General", "Feats of Strength")
    if (parent.children.length === 0) {
      this.selectCategory(parent.id);
      // Collapse any expanded parent
      this.expandedParents.set(new Set());
      return;
    }

    // Otherwise, expand/collapse the parent and navigate to its achievements
    const isExpanded = this.expandedParents().has(parent.id);
    this.expandedParents.update((set) => {
      const next = new Set(set);
      if (isExpanded) {
        next.delete(parent.id);
      } else {
        next.clear();
        next.add(parent.id);
      }
      return next;
    });

    if (!isExpanded) {
      this.selectCategory(parent.id);
    }
  }

  isParentExpanded(parentId: number): boolean {
    return this.expandedParents().has(parentId);
  }

  toggleStatistic(catId: number): void {
    const isExpanded = this.expandedStatistics().has(catId);
    this.expandedStatistics.update((set) => {
      const next = new Set(set);
      if (isExpanded) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });

    if (!isExpanded) {
      this.selectCategory(catId);
    }
  }

  isStatisticExpanded(catId: number): boolean {
    return this.expandedStatistics().has(catId);
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

  isStatCategory(catId: number): boolean {
    return STATS_CATEGORY_IDS.has(catId);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
