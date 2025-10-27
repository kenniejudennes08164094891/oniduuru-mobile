import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ProfilePageComponent } from './scouter/profile-page/profile-page.component';
import { AccountActivationPageComponent } from './scouter/account-activation-page/account-activation-page.component';
import { ViewAllHiresPageComponent } from './scouter/view-all-hires-page/view-all-hires-page.component';
import { HireTalentPageComponent } from './scouter/hire-talent-page/hire-talent-page.component';
import { WalletPageComponent } from './scouter/wallet-page/wallet-page.component';
import { MarketEngagementMarketPricePreparationComponent } from './scouter/market-engagement-market-price-preparation/market-engagement-market-price-preparation.component';
import { WalletProfileComponent } from './scouter/wallet-profile/wallet-profile.component';
import { FundWalletComponent } from './scouter/fund-wallet/fund-wallet.component';
import { WithdrawFundComponent } from './scouter/withdraw-fund/withdraw-fund.component';
import { FundTransferComponent } from './scouter/fund-transfer/fund-transfer.component';
import { WelcomeToOniduuruMarketplacePageComponent } from './scouter/welcome-to-oniduuru-marketplace-page/welcome-to-oniduuru-marketplace-page.component';
import { ViewAllTalentsPageComponent } from './scouter/view-all-talents-page/view-all-talents-page.component';
import { ViewTalentsLocationPageComponent } from './scouter/view-talents-location-page/view-talents-location-page.component';
import { ConcludeYourHiringProcessPageComponent } from './scouter/conclude-your-hiring-process-page/conclude-your-hiring-process-page.component';
import { MarketPricePrepositionPage } from './talent/market-price-preposition/market-price-preposition.page';
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
  path: 'talent/onboarding',
  loadChildren: () =>
    import('./talent/onboarding/onboarding.module').then(m => m.OnboardingPageModule)
},
  {
    path: 'scouter',
    loadChildren: () =>
      import('./scouter/scouter.module').then((m) => m.ScouterPageModule),
  },
  {
    path: 'talent',

    loadChildren: () => import('./talent/talent.module').then(m => m.TalentPageModule),
  },
  {
    path: 'create-record/:talentId',
    loadChildren: () =>
      import('./talent/create-record/create-record.module').then(
        (m) => m.CreateRecordPageModule
      ),
  },
  {
    path: 'view-hires',
    loadChildren: () =>
      import('./talent/view-hires/view-hires.module').then(m => m.ViewHiresPageModule)
  },
  {
    path: 'market-price-preposition',
    loadChildren: () =>
      import('./talent/market-price-preposition/market-price-preposition.module').then(
        (m) => m.MarketPricePrepositionPageModule
      ),
  },
  { path: '', redirectTo: 'market-price-preposition', pathMatch: 'full' },
  {
    path: 'market-price-preposition',
    loadChildren: () =>
      import('./talent/market-price-preposition/market-price-preposition.module').then(
        (m) => m.MarketPricePrepositionPageModule
      ),
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
  {
    path: 'scouter/wallet-page/wallet-profile',
    component: WalletProfileComponent,
  },
  {
    path: 'scouter/wallet-page/fund-wallet',
    component: FundWalletComponent,
  },
  {
    path: 'scouter/wallet-page/withdraw-funds',
    component: WithdrawFundComponent,
  },
  {
    path: 'scouter/wallet-page/fund-transfer',
    component: FundTransferComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru',
    component: WelcomeToOniduuruMarketplacePageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru/view-all-talents',
    component: ViewAllTalentsPageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location',
    component: ViewTalentsLocationPageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location/conclude-hiring',
    component: ConcludeYourHiringProcessPageComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
