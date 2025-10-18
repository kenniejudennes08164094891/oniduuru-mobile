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
import { FundWalletRequestPageComponent } from './scouter/fund-wallet-request-page/fund-wallet-request-page.component';
import { WithdrawFundsRequestPageComponent } from './scouter/withdraw-funds-request-page/withdraw-funds-request-page.component';
import { TransferFundsRequestPageComponent } from './scouter/transfer-funds-request-page/transfer-funds-request-page.component';
import { AuthRedirectGuard } from './guard/auth.guard';
import { LoginGuard } from './guard/login.guard';

const routes: Routes = [
  { path: '', redirectTo: 'welcome-page', pathMatch: 'full' },

  {
    path: 'welcome-page',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'auth',
    canActivate: [LoginGuard],
    loadChildren: () =>
      import('./auth/auth.module').then((m) => m.AuthPageModule),
  },
  {
    path: 'scouter',
    // canActivate: [AuthRedirectGuard],
    loadChildren: () =>
      import('./scouter/scouter.module').then((m) => m.ScouterPageModule),
  },
  {
    path: 'talent',
    // canActivate: [AuthRedirectGuard],
    loadChildren: () =>
      import('./talent/talent.module').then((m) => m.TalentPageModule),
  },
  {
    path: 'view-hires',
    // canActivate: [AuthRedirectGuard],
    loadChildren: () =>
      import('./talent/view-hires/view-hires.module').then(
        (m) => m.ViewHiresPageModule
      ),
  },
  {
    path: 'market-price-preposition',
    // canActivate: [AuthRedirectGuard],
    loadChildren: () =>
      import(
        './talent/market-price-preposition/market-price-preposition.module'
      ).then((m) => m.MarketPricePrepositionPageModule),
  },
  {
    path: 'utilities',
    loadChildren: () =>
      import('./utilities/utilities.module').then((m) => m.UtilitiesPageModule),
  },
  {
    path: 'scouter/profile',
    // canActivate: [AuthRedirectGuard],
    component: ProfilePageComponent,
  },
  {
    path: 'scouter/account-activation',
    // canActivate: [AuthRedirectGuard],
    component: AccountActivationPageComponent,
  },
  {
    path: 'scouter/view-hires',
    // canActivate: [AuthRedirectGuard],
    component: ViewAllHiresPageComponent,
  },
  {
    path: 'scouter/hire-talent',
    // canActivate: [AuthRedirectGuard],
    component: HireTalentPageComponent,
  },
  {
    path: 'scouter/wallet-page',
    // canActivate: [AuthRedirectGuard],
    component: WalletPageComponent,
  },
  {
    path: 'scouter/market-engagement-market-price-preparation/:id',
    // canActivate: [AuthRedirectGuard],
    component: MarketEngagementMarketPricePreparationComponent,
  },
  {
    path: 'scouter/wallet-page/wallet-profile',
    // canActivate: [AuthRedirectGuard],
    component: WalletProfileComponent,
  },
  {
    path: 'scouter/wallet-page/fund-wallet',
    // canActivate: [AuthRedirectGuard],
    component: FundWalletComponent,
  },
  {
    path: 'scouter/wallet-page/fund-wallet/fund-wallet-request/:id',
    // canActivate: [AuthRedirectGuard],
    component: FundWalletRequestPageComponent,
  },
  {
    path: 'scouter/wallet-page/withdraw-funds',
    // canActivate: [AuthRedirectGuard],
    component: WithdrawFundComponent,
  },
  {
    path: 'scouter/wallet-page/withdraw-funds/withdraw-funds-request/:id',
    // canActivate: [AuthRedirectGuard],
    component: WithdrawFundsRequestPageComponent,
  },
  {
    path: 'scouter/wallet-page/fund-transfer',
    // canActivate: [AuthRedirectGuard],
    component: FundTransferComponent,
  },
  {
    path: 'scouter/wallet-page/fund-transfer/fund-transfer-request/:id',
    // canActivate: [AuthRedirectGuard],
    component: TransferFundsRequestPageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru',
    // canActivate: [AuthRedirectGuard],
    component: WelcomeToOniduuruMarketplacePageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru/view-all-talents',
    // canActivate: [AuthRedirectGuard],
    component: ViewAllTalentsPageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location',
    // canActivate: [AuthRedirectGuard],
    component: ViewTalentsLocationPageComponent,
  },
  {
    path: 'scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location/conclude-hiring',
    // canActivate: [AuthRedirectGuard],
    component: ConcludeYourHiringProcessPageComponent,
  },
  // 🧾 Fallback — unknown routes redirect to login
  // { path: '**', redirectTo: 'auth/login', pathMatch: 'full' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
