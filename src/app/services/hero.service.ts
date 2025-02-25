import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    map,
    shareReplay,
    switchMap,
} from 'rxjs/operators';
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
const DEFAULT_LIMIT = LIMIT_HIGH;

const DEFAULT_SEARCH = '';
const DEFAULT_PAGE = 0;

@Injectable({
    providedIn: 'root',
})
export class HeroService {
    limits = LIMITS;
    //this pattern is service with a subject (aka observable services/reactive services)
    private searchBS = new BehaviorSubject<string>(DEFAULT_SEARCH);
    private limitBS = new BehaviorSubject<number>(DEFAULT_LIMIT);
    private pageBS = new BehaviorSubject<number>(DEFAULT_PAGE);

    search$ = this.searchBS.asObservable();
    limit$ = this.limitBS.asObservable();
    //page$ = this.pageBS.asObservable(); //not used

    userPage$ = this.pageBS.pipe(map(page => page + 1));

    private params$ = combineLatest([
        this.searchBS.pipe(debounceTime(500)),
        this.limitBS,
        this.pageBS.pipe(debounceTime(500)),
    ]).pipe(
        //hey if the things coming down the pipe are the same then return don't map
        //distinct until change does a shallow comparison
        distinctUntilChanged((prev, current) => {
            return JSON.stringify(prev) === JSON.stringify(current);
        }),
        map(([searchTerm, limit, page]) => {
            const params: any = {
                apikey: environment.MARVEL_API.PUBLIC_KEY,
                limit: `${limit}`,
                offset: `${page * limit}`, // page * limit
            };
            if (searchTerm.length) {
                params.nameStartsWith = searchTerm;
            }

            return params;
        }),
    );

    private heroesResponse$ = this.params$.pipe(
        switchMap(_params => this.http.get(HERO_API, { params: _params })),
        shareReplay(1),
    );

    totalResults$ = this.heroesResponse$.pipe(
        map((res: any) => res.data.total),
    );

    totalPages$ = combineLatest([this.totalResults$, this.limitBS]).pipe(
        map(([totalResults, limit]) => Math.ceil(totalResults / limit)),
    );

    heroes$: Observable<Hero[]> = this.heroesResponse$.pipe(
        map((res: any) => res.data.results),
    );

    doSearch(term: string) {
        this.searchBS.next(term);
        this.pageBS.next(DEFAULT_PAGE);
    }

    movePageBy(moveBy: number) {
        const currentPage = this.pageBS.getValue();
        this.pageBS.next(currentPage + moveBy);
    }

    setLimit(newLimit: number) {
        this.limitBS.next(newLimit);
    }

    constructor(private http: HttpClient) {}
}
