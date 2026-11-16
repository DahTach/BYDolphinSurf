import { ViewportScroller } from '@angular/common';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // anchorScrolling: the settings sheet "Consegna e consumo" jumps to the #veicolo card (design D7)
    // scrollPositionRestoration: route changes land at the top of the frame (design D8)
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    // scrollOffset [0, 96]: land the anchor below the 56px sticky header AND the car breakout that
    //   overhangs the #veicolo card's top edge by ≈36px (gemini vehicle maintenance card).
    //   RouterConfigOptions carries no scrollOffset in this Angular version and RouterScroller
    //   never applies one on the provideRouter path — the ViewportScroller offset is what the
    //   anchor scroll (scrollToElement) actually honors. scrollToPosition (restoration) ignores it.
    provideEnvironmentInitializer(() => inject(ViewportScroller).setOffset([0, 96])),
  ]
};
