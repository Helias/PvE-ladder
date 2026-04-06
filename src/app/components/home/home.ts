import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterRank, getFaction } from '../../models/character';
import { PveApiService } from '../../services/pve-api.service';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styleUrl: './home.css',
  template: `
    <div class="mx-auto max-w-5xl px-4 py-6">
      <div class="mb-4">
        <label for="search" class="sr-only">Search characters</label>
        <input
          id="search"
          type="text"
          placeholder="Search character..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          class="w-full rounded border-2 border-[#333] bg-[#222] px-4 py-2 font-bold text-[#555] placeholder-[#555] transition-colors duration-300 focus:border-[#999] focus:bg-white focus:text-[#111] focus:outline-none"
          aria-label="Search characters by name"
        />
      </div>

      <div
        class="overflow-x-auto rounded-lg border border-[#333]"
        role="region"
        aria-label="Character rankings"
      >
        <table class="w-full text-left" aria-label="Character rankings table">
          <thead>
            <tr class="bg-[#ffffff22]">
              <th scope="col" class="px-4 py-3 font-semibold text-white">#</th>
              <th scope="col" class="px-4 py-3 font-semibold text-white">Character</th>
              <th scope="col" class="px-4 py-3 font-semibold text-center text-white">Lvl</th>
              <th scope="col" class="px-4 py-3 font-semibold text-right text-white">Points</th>
            </tr>
          </thead>
          <tbody>
            @for (rank of filteredRanks(); track rank.guid; let i = $index) {
              <tr
                class="rank-row"
                [class.row-odd]="i % 2 === 0"
                [class.row-even]="i % 2 !== 0"
                (click)="showPlayerStats(rank.guid)"
                (keydown.enter)="showPlayerStats(rank.guid)"
                tabindex="0"
                [attr.aria-label]="
                  'Rank ' +
                  (rankOffset() + i + 1) +
                  ': ' +
                  rank.name +
                  ', ' +
                  rank.achievement_points +
                  ' points'
                "
                role="link"
              >
                <td class="px-4 py-3 text-gray-500">{{ rankOffset() + i + 1 }}</td>
                <td class="px-4 py-3 font-bold" [class]="rank.faction">
                  <img
                    [src]="'/img/race/64/' + rank.race + '-' + rank.gender + '.png'"
                    [alt]="'Race ' + rank.race"
                    width="32"
                    height="32"
                    class="inline-block"
                  />
                  <img
                    [src]="'/img/class/64/' + rank.class + '.png'"
                    [alt]="'Class ' + rank.class"
                    width="32"
                    height="32"
                    class="inline-block"
                  />
                  {{ rank.name }}
                </td>
                <td class="px-4 py-3 text-center">{{ rank.level }}</td>
                <td class="px-4 py-3 text-right font-bold text-wow-gold">
                  {{ rank.achievement_points }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div
          class="mt-4 flex items-center justify-center gap-2"
          role="navigation"
          aria-label="Pagination"
        >
          <button
            class="pagination-btn"
            [disabled]="currentPage() <= 1"
            (click)="goToPage(currentPage() - 1)"
            aria-label="Previous page"
          >
            &laquo;
          </button>
          @for (p of visiblePages(); track p) {
            <button
              class="pagination-btn"
              [class.active]="p === currentPage()"
              (click)="goToPage(p)"
              [attr.aria-label]="'Page ' + p"
              [attr.aria-current]="p === currentPage() ? 'page' : null"
            >
              {{ p }}
            </button>
          }
          <button
            class="pagination-btn"
            [disabled]="currentPage() >= totalPages()"
            (click)="goToPage(currentPage() + 1)"
            aria-label="Next page"
          >
            &raquo;
          </button>
        </div>
      }
    </div>
  `,
})
export class Home implements OnInit {
  private readonly api = inject(PveApiService);
  private readonly router = inject(Router);

  private readonly pageSize = 10;

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

  readonly filteredRanks = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allRanks = this.ranks();
    if (!query) return allRanks;
    return allRanks.filter((r) => r.name.toLowerCase().includes(query));
  });

  ngOnInit(): void {
    this.loadPage(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.loadPage(page);
  }

  private loadPage(page: number): void {
    this.api.getCharacterAchievements(page, this.pageSize).subscribe((res) => {
      const ranked = res.data.map((r) => ({
        ...r,
        faction: getFaction(r.race),
      }));
      this.ranks.set(ranked);
      this.currentPage.set(res.page);
      this.totalItems.set(res.total);
    });
  }

  showPlayerStats(guid: number): void {
    this.router.navigate(['/player', guid]);
  }
}
