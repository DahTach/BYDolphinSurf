import { ViewportScroller } from '@angular/common';
import { ApplicationConfig, inject, isDevMode, provideBrowserGlobalErrorListeners, provideEnvironmentInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // anchorScrolling: the settings sheet "Consegna e consumo" jumps to the #veicolo card (design D7)
    // scrollPositionRestoration: route changes land at the top of the frame (design D8)
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    // scrollOffset [0, 96]: land the anchor below the 56px sticky header (the car stage
    //   overhangs the card's top edge by ~30-40px, so the extra headroom keeps it clear).
    //   RouterConfigOptions carries no scrollOffset in this Angular version and RouterScroller
    //   never applies one on the provideRouter path — the ViewportScroller offset is what the
    //   anchor scroll (scrollToElement) actually honors. scrollToPosition (restoration) ignores it.
    provideEnvironmentInitializer(() => inject(ViewportScroller).setOffset([0, 96])),
    // PWA service worker: enabled only in production (`isDevMode()` is false there and the
    //   "serviceWorker" build option exists only under build.configurations.production in
    //   angular.json, so ngsw-worker.js is never emitted for `ng serve`/development builds).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:3000',
    }),
  ]
};
