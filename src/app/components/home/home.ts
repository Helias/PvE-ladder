import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CharacterRank, getFaction } from '../../models/character';
import { PveApiService } from '../../services/pve-api.service';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly api = inject(PveApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly pageSize = 10;
  private readonly searchSubject = new Subject<string>();

  readonly ranks = signal<CharacterRank[]>([]);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly totalItems = signal(0);

  readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));
  readonly rankOffset = computed(() => (this.currentPage() - 1) * this.pageSize);

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) =>
          this.api.getCharacterAchievements(1, this.pageSize, query || undefined)
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((res) => {
        this.applyResponse(res);
      });

    this.loadPage(1);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.loadPage(page);
  }

  private loadPage(page: number): void {
    const name = this.searchQuery() || undefined;
    this.api.getCharacterAchievements(page, this.pageSize, name).subscribe((res) => {
      this.applyResponse(res);
    });
  }

  private applyResponse(res: { data: CharacterRank[]; page: number; total: number }): void {
    const ranked = res.data.map((r) => ({
      ...r,
      faction: getFaction(r.race),
    }));
    this.ranks.set(ranked);
    this.currentPage.set(res.page);
    this.totalItems.set(res.total);
    this.cdr.markForCheck();
  }

  showPlayerStats(guid: number): void {
    this.router.navigate(['/player', guid]);
  }
}
