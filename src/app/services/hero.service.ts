import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Hero {
    id: number;
    name: string;
    description: string;
    thumbnail: HeroThumbnail;
    resourceURI: string;
    comics: HeroSubItems;
    events: HeroSubItems;
    series: HeroSubItems;
    stories: HeroSubItems;
}

export interface HeroThumbnail {
    path: string;
    extendion: string;
}

export interface HeroSubItems {
    available: number;
    returned: number;
    collectionURI: string;
    items: HeroSubItem[];
}

export interface HeroSubItem {
    resourceURI: string;
    name: string;
}

// The URL to the Marvel API
const HERO_API = `${environment.MARVEL_API.URL}/v1/public/characters`;

// Our Limits for Search
const LIMIT_LOW = 10;
const LIMIT_MID = 25;
const LIMIT_HIGH = 100;
const LIMITS = [LIMIT_LOW, LIMIT_MID, LIMIT_HIGH];

const DEFAULT_PAGE = 0;

@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;

    private searchBS = new BehaviorSubject('');
    private pageBS = new BehaviorSubject(DEFAULT_PAGE);
    private limitBS = new BehaviorSubject(LIMIT_LOW);

    search$ = this.searchBS.asObservable();
    page$ = this.pageBS.asObservable();
    limit$ = this.limitBS.asObservable();

    userPage$ = this.page$.pipe(map(page => page + 1));

    changes = combineLatest([this.searchBS, this.pageBS, this.limitBS]);

    private heroesResponse$ = this.changes.pipe(
        debounceTime(500),
        switchMap(([search, page, limit]) => {
            const params: any = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`, // page * limit
            };

            if (search) {
                params.nameStartsWith = search;
            }
            return this.http.get(HERO_API, {
                params,
            });
        }),
        shareReplay(1),
    );
    totalHeroes$ = this.heroesResponse$.pipe(map((res: any) => res.data.total));
    heroes$ = this.heroesResponse$.pipe(map((res: any) => res.data.results));
    totalPages$ = combineLatest([this.totalHeroes$, this.limit$]).pipe(
        map(([totalHeroes, limit]) => Math.ceil(totalHeroes / limit)),
    );

    constructor(private http: HttpClient) {}

    movePageBy(moveBy: number): void {
        this.pageBS.next(this.pageBS.value + moveBy);
    }

    doSearch(term: string): void {
        this.pageBS.next(0);
        this.searchBS.next(term);
    }

    setLimit(limit: number): void {
        this.pageBS.next(0);
        this.limitBS.next(limit);
    }
}
