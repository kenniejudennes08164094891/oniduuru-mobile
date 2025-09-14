import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ProfilePageComponent } from './scouter/profile-page/profile-page.component';
import { AccountActivationPageComponent } from './scouter/account-activation-page/account-activation-page.component';
import { ViewAllHiresPageComponent } from './scouter/view-all-hires-page/view-all-hires-page.component';
import { HireTalentPageComponent } from './scouter/hire-talent-page/hire-talent-page.component';
import { WalletPageComponent } from './scouter/wallet-page/wallet-page.component';
import { MarketEngagementMarketPricePreparationComponent } from './scouter/market-engagement-market-price-preparation/market-engagement-market-price-preparation.component';

const routes: Routes = [
  { path: '', redirectTo: 'welcome-page', pathMatch: 'full' },

  {
    path: 'welcome-page',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/auth.module').then((m) => m.AuthPageModule),
  },
  {
    path: 'scouter',
    loadChildren: () =>
      import('./scouter/scouter.module').then((m) => m.ScouterPageModule),
  },
  {
    path: 'talent',
    loadChildren: () =>
      import('./talent/talent.module').then((m) => m.TalentPageModule),
  },
  {
    path: 'utilities',
    loadChildren: () =>
      import('./utilities/utilities.module').then((m) => m.UtilitiesPageModule),
  },
  {
    path: 'scouter/profile',
    component: ProfilePageComponent,
  },
  {
    path: 'scouter/account-activation',
    component: AccountActivationPageComponent,
  },
  {
    path: 'scouter/view-hires',
    component: ViewAllHiresPageComponent,
  },
  {
    path: 'scouter/hire-talent',
    component: HireTalentPageComponent,
  },
  {
    path: 'scouter/wallet-page',
    component: WalletPageComponent,
  },
  {
    path: 'scouter/market-engagement-market-price-preparation/:id',
    component: MarketEngagementMarketPricePreparationComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
