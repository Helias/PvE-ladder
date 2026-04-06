import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { Achievement, AchievementCategory } from '../../models/achievement';
import { PveApiService } from '../../services/pve-api.service';

interface StatView {
  id: number;
  name: string;
  description: string;
  icon: string;
  counter: string;
  counterHtml: SafeHtml | null;
  quantity: number;
  counterNum: number;
  completed: boolean;
  hasProgress: boolean;
  progressPercent: number;
}

@Component({
  selector: 'app-statistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class Statistics implements OnInit {
  private readonly api = inject(PveApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  private readonly listContainer = viewChild<ElementRef<HTMLElement>>('listContainer');

  readonly category = signal<AchievementCategory | null>(null);
  readonly stats = signal<StatView[]>([]);

  ngOnInit(): void {
    const characterId = Number(this.route.parent?.snapshot.paramMap.get('id'));

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const statsId = Number(params.get('statsId'));
          return forkJoin({
            category: this.api.getAchievementCategory(statsId),
            progress: this.api.getAchievementProgress(characterId, statsId),
            achievements: this.api.getAchievementsByCategory(statsId),
          }).pipe(
            switchMap(({ category, progress, achievements }) => {
              // Return the data along with statsId for money formatting
              return [{ category, progress, achievements, statsId }];
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ category, progress, achievements, statsId }) => {
        this.category.set(category);

        const progressMap = new Map(progress.map((p) => [p.achievement, p.counter]));

        const views: StatView[] = achievements
          .filter((a) => !(statsId === 140 && (a.ID === 329 || a.ID === 330)))
          .map((ach) => this.buildStatView(ach, progressMap, statsId));

        this.stats.set(views);

        const container = this.listContainer()?.nativeElement;
        if (container) {
          container.scrollTop = 0;
        }
      });
  }

  private buildStatView(
    ach: Achievement,
    progressMap: Map<number, number>,
    statsId: number,
  ): StatView {
    const rawCounter = progressMap.get(ach.ID);
    const hasData = rawCounter !== undefined && rawCounter > 0;
    const counterNum = rawCounter ?? 0;
    const quantity = ach.Quantity;
    const hasProgress = quantity > 1 && hasData;
    const progressPercent = hasProgress ? Math.min((counterNum / quantity) * 100, 100) : 0;

    const counter = hasData ? String(counterNum) : '-';
    let counterHtml: SafeHtml | null = null;

    if (statsId === 140 && hasData) {
      counterHtml = this.formatMoney(counterNum);
    }

    return {
      id: ach.ID,
      name: ach.Name,
      description: ach.Description,
      icon: ach.icon === 'NULL' || !ach.icon ? 'trade_engineering' : ach.icon,
      counter,
      counterHtml,
      quantity,
      counterNum,
      completed: hasData,
      hasProgress,
      progressPercent,
    };
  }

  private formatMoney(copper: number): SafeHtml {
    const gold = Math.floor(copper / 10000);
    const silver = Math.floor((copper % 10000) / 100);
    const copperRem = copper % 100;

    const html =
      `${gold} <img src="img/money/gold.png" alt="gold" width="16" height="16" class="inline-block align-middle"> ` +
      `${silver} <img src="img/money/silver.png" alt="silver" width="16" height="16" class="inline-block align-middle"> ` +
      `${copperRem} <img src="img/money/copper.png" alt="copper" width="16" height="16" class="inline-block align-middle">`;

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
