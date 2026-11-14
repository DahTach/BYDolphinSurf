import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'attivita',
    loadComponent: () => import('./pages/activities/activities').then((m) => m.Activities),
  },
  {
    path: 'storico',
    loadComponent: () => import('./pages/history/history').then((m) => m.History),
  },
  {
    path: 'prodotti',
    loadComponent: () => import('./pages/products/products').then((m) => m.Products),
  },
  { path: '**', redirectTo: '' },
];
