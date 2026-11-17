import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate, VersionEvent } from '@angular/service-worker';

/** Grace window after boot during which a ready update applies silently (design P1). */
const BOOT_AUTO_UPDATE_MS = 30_000;
/** Grace window after the tab becomes visible again (resume) — silent apply (design P1). */
const RESUME_AUTO_UPDATE_MS = 15_000;

const SNACKBAR_ID = 'ngsw-update-snackbar';
const SNACKBAR_STYLE_ID = 'ngsw-update-snackbar-style';

/**
 * Update flow for the PWA (self-updating app, design P1/P2):
 * - checks for a new version once at construction and on every visibilitychange→visible
 *   (no polling);
 * - within the grace window (30s after boot, 15s after tab resume) a VERSION_READY
 *   applies silently (activateUpdate + reload);
 * - outside it, a dismissible snackbar offers "Ricarica";
 * - unrecoverable SW state → log + reload.
 *
 * All snackbar styles live here (a <style> block is injected on first prompt) —
 * never in src/styles.scss, which another agent owns concurrently.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly destroyRef = inject(DestroyRef);

  /** Until when a newly found version may be applied without asking the user. */
  private autoUpdateUntil = Date.now() + BOOT_AUTO_UPDATE_MS;

  private snackbar: HTMLElement | null = null;

  constructor() {
    if (!this.swUpdate.isEnabled) return;
    this.listenForVersionUpdates();
    this.listenForUnrecoverable();
    this.listenForVisibilityChange();
    void this.checkForUpdate();
  }

  private listenForVersionUpdates(): void {
    this.swUpdate.versionUpdates
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((evt: VersionEvent) => {
        switch (evt.type) {
          case 'VERSION_READY':
            if (Date.now() < this.autoUpdateUntil) {
              void this.applyUpdate();
            } else {
              this.promptUpdate();
            }
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.error(
              `[ngsw] Installazione versione '${evt.version.hash}' fallita: ${evt.error}`,
            );
            break;
        }
      });
  }

  private listenForUnrecoverable(): void {
    this.swUpdate.unrecoverable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((evt) => {
      console.error('[ngsw] Stato irrecuperabile:', evt.reason);
      document.location.reload();
    });
  }

  private listenForVisibilityChange(): void {
    const onVisible = (): void => {
      if (document.visibilityState !== 'visible') return;
      this.autoUpdateUntil = Date.now() + RESUME_AUTO_UPDATE_MS;
      void this.checkForUpdate();
    };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private async checkForUpdate(): Promise<void> {
    try {
      await this.swUpdate.checkForUpdate();
    } catch (err) {
      console.error('[ngsw] Controllo aggiornamenti fallito:', err);
    }
  }

  /** Dismissible snackbar prompt (outside the grace window). */
  private promptUpdate(): void {
    if (this.snackbar != null) return; // already showing
    try {
      this.injectStyles();

      const bar = document.createElement('div');
      bar.id = SNACKBAR_ID;
      bar.setAttribute('role', 'status');
      bar.setAttribute('aria-live', 'polite');

      const text = document.createElement('div');
      text.className = 'ngsw-snack-text';
      const title = document.createElement('strong');
      title.className = 'ngsw-snack-title';
      title.textContent = 'Nuova versione disponibile';
      const sub = document.createElement('span');
      sub.className = 'ngsw-snack-sub';
      sub.textContent = 'Novità e correzioni — ricarica per aggiornare';
      text.append(title, sub);

      const actions = document.createElement('div');
      actions.className = 'ngsw-snack-actions';
      const reload = document.createElement('button');
      reload.type = 'button';
      reload.className = 'ngsw-snack-action';
      reload.textContent = 'Ricarica';
      reload.addEventListener('click', () => void this.applyUpdate());
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'ngsw-snack-dismiss';
      dismiss.setAttribute('aria-label', 'Chiudi');
      dismiss.textContent = '✕';
      dismiss.addEventListener('click', () => this.dismiss());
      actions.append(reload, dismiss);

      bar.append(text, actions);
      document.body.appendChild(bar);
      this.snackbar = bar;
    } catch (err) {
      console.error('[ngsw] Impossibile mostrare il promemoria di aggiornamento:', err);
      // Worst case: fall back to the silent apply so the update still lands.
      void this.applyUpdate();
    }
  }

  private dismiss(): void {
    this.snackbar?.remove();
    this.snackbar = null;
  }

  private async applyUpdate(): Promise<void> {
    this.dismiss();
    try {
      await this.swUpdate.activateUpdate();
    } catch (err) {
      console.error('[ngsw] Attivazione aggiornamento fallita:', err);
    } finally {
      document.location.reload();
    }
  }

  /** One-shot injection of the snackbar styles (kept out of styles.scss — file ownership). */
  private injectStyles(): void {
    if (document.getElementById(SNACKBAR_STYLE_ID) != null) return;
    const style = document.createElement('style');
    style.id = SNACKBAR_STYLE_ID;
    style.textContent = `
      #${SNACKBAR_ID} {
        position: fixed;
        left: 50%;
        bottom: 96px;
        transform: translateX(-50%);
        z-index: 1000;
        box-sizing: border-box;
        width: calc(100% - 32px);
        max-width: 430px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 12px 12px 18px;
        background: #ede6da;
        color: #221c14;
        border-radius: 18px;
        font-family: "Google Sans Flex", "Google Sans", Roboto, system-ui, sans-serif;
        font-size: 14px;
        line-height: 1.35;
        animation: ngsw-snack-in 480ms cubic-bezier(0.38, 1.21, 0.22, 1) both;
      }

      #${SNACKBAR_ID} .ngsw-snack-text {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      #${SNACKBAR_ID} .ngsw-snack-title {
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      #${SNACKBAR_ID} .ngsw-snack-sub {
        font-size: 12.5px;
        color: #54483b;
      }

      #${SNACKBAR_ID} .ngsw-snack-actions {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      #${SNACKBAR_ID} .ngsw-snack-action {
        appearance: none;
        border: 0;
        cursor: pointer;
        padding: 9px 18px;
        border-radius: 9999px;
        background: #221c14;
        color: #ede6da;
        font: inherit;
        font-weight: 600;
        transition: transform 160ms cubic-bezier(0.38, 1.21, 0.22, 1), opacity 160ms ease;
      }

      #${SNACKBAR_ID} .ngsw-snack-action:hover {
        transform: scale(1.04);
      }

      #${SNACKBAR_ID} .ngsw-snack-action:active {
        transform: scale(0.97);
      }

      #${SNACKBAR_ID} .ngsw-snack-dismiss {
        appearance: none;
        border: 0;
        cursor: pointer;
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        background: transparent;
        color: #54483b;
        font-size: 14px;
        line-height: 1;
        transition: background-color 160ms ease;
      }

      #${SNACKBAR_ID} .ngsw-snack-dismiss:hover {
        background: rgba(34, 28, 20, 0.1);
      }

      @keyframes ngsw-snack-in {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(24px) scale(0.94);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${SNACKBAR_ID} {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
