import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, viewChildren } from '@angular/core';

import { playEntrance } from '../../shared/motion';

/* Prodotti (ui-drafts/b-blade.html §5): the two static reference cards with verbatim
   content — component data, NOT persisted in the store (specs/products). Polish:
   type roles + 20px tile radius on the MAI box (design D3) + the staggered `.enter`
   entrance on route activation only (design D11); cards get NO press feedback. */

interface ProductItem {
  name: string;
  desc: string;
}

interface ProductCard {
  title: string;
  chip: string;
  chipClass: string;
  items: ProductItem[];
  mai: string;
}

@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './products.html',
})
export class Products {
  protected readonly cards: ProductCard[] = [
    {
      title: 'Sicuri su EPDM',
      chip: '<1–2% rigonfiamento',
      chipClass: 'bg-okC text-onOkC',
      items: [
        { name: 'Krytox GPL 205', desc: 'lubrificante PFPE inerte' },
        { name: 'Molykote 111', desc: 'pasta PDMS pura' },
        { name: 'Glicerina pura', desc: 'grado farmaceutico' },
      ],
      mai: 'MAI: WD-40, vaselina, spray siliconici',
    },
    {
      title: 'Antiruggine sottoscocca',
      chip: '70 kV dielettrico',
      chipClass: 'bg-terC text-onTerC',
      items: [
        { name: 'Lanoguard', desc: 'lanolina senza solventi' },
        { name: 'Dinitrol 3125 / 4941', desc: 'cera sintetica elastica' },
      ],
      mai: 'MAI su dischi freno, connettori AT, piastra batteria',
    },
  ];

  private readonly cardBlocks = viewChildren('cardBlock', { read: ElementRef });

  constructor() {
    // Staggered entrance on route activation only (design D11).
    afterNextRender(() => this.playEntranceOn(this.cardBlocks()));
  }

  /** Replays the `.enter` entrance on `blocks` via the shared playEntrance().
   *  Blocks render `enter in` (revealed), so the replay first snaps them back to
   *  the hidden start state with transitions disabled: a plain class restart on a
   *  revealed block is cancelled by CSS transition retargeting and would be a
   *  no-op. */
  private playEntranceOn(blocks: readonly ElementRef<HTMLElement>[]): void {
    const els = blocks.map((ref) => ref.nativeElement);
    for (const el of els) {
      el.style.transition = 'none';
      el.classList.remove('in');
    }
    if (els.length > 0) void els[0].offsetHeight; // commit the hidden start state without transitioning
    for (const el of els) el.style.transition = '';
    playEntrance(els);
  }
}
