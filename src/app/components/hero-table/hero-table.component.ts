import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Hero, HeroService } from '../../services/hero.service';

@Component({
    selector: 'rx-hero-table',
    templateUrl: './hero-table.component.html',
    styleUrls: ['./hero-table.component.scss'],
})
export class HeroTableComponent {
    //basic version
    // heroes$: Observable<Hero[]> = this.hero.heroes$;
    // search$ = this.hero.searchBS;
    // page$ = this.hero.userPage$;
    // limit$ = this.hero.limitBS;
    // totalResults$ = this.hero.totalResults$;
    // totalPages$ = this.hero.totalPages$;

    //Replace the dom with this one object in the top level ngIf and bind all properites
    //of the vm object(replacing the async)
    //improved version(lose the need to async on the html template)
    viewModel$ = combineLatest([
        this.hero.heroes$,
        this.hero.searchBS,
        this.hero.userPage$,
        this.hero.limitBS,
        this.hero.totalResults$,
        this.hero.totalPages$,
    ]).pipe(
        map(([heroes, search, page, limit, totalResults, totalPages]) => {
            return {
                heroes,
                search,
                page,
                limit,
                totalResults,
                totalPages,
                disableNext: totalPages === page,
                disablePrevious: page === 1,
            };
        }),
    );

    constructor(public hero: HeroService) {}

    doSearch(event: any) {
        this.hero.searchBS.next(event.target.value);
    }

    movePageBy(moveBy: number) {
        const currentPage = this.hero.pageBS.getValue();
        this.hero.pageBS.next(currentPage + moveBy);
    }

    setLimit(limit: number) {
        this.hero.limitBS.next(limit);
    }
}
