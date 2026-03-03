// app-routing.module.ts - Updated version
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
import { FundWalletRequestPageComponent } from './scouter/fund-wallet-request-page/fund-wallet-request-page.component';
import { WithdrawFundsRequestPageComponent } from './scouter/withdraw-funds-request-page/withdraw-funds-request-page.component';
import { TransferFundsRequestPageComponent } from './scouter/transfer-funds-request-page/transfer-funds-request-page.component';
import { AuthRedirectGuard, ProtectedRouteGuard } from './guard/auth.guard';
import { LoginGuard } from './guard/login.guard';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'welcome-page', pathMatch: 'full' },

  {
    path: 'chat',
    component: ChatPageComponent,
    data: { animation: 'chatPage' },
  },

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
    path: 'talent/onboarding',
    loadComponent: () =>
      import('./talent/onboarding/onboarding.page').then(
        (m) => m.OnboardingPage,
      ),
  },
  // public entry point for scouter sign‑up (doesn't require authentication)
  // placed before the guarded "scouter" route so it matches first.
  {
    path: 'scouter/create-account',
    canActivate: [LoginGuard], // prevent logged‑in users from accessing the signup flow
    loadChildren: () =>
      import('./scouter/scouter.module').then((m) => m.ScouterPageModule),
  },
  {
    path: 'scouter',
    canActivate: [ProtectedRouteGuard],
    loadChildren: () =>
      import('./scouter/scouter.module').then((m) => m.ScouterPageModule),
  },
  {
    path: 'talent',
    canActivate: [ProtectedRouteGuard],
    loadChildren: () =>
      import('./talent/talent.module').then((m) => m.TalentPageModule),
  },
  {
    path: 'create-record/:talentId',
    loadChildren: () =>
      import('./talent/create-record/create-record.module').then(
        (m) => m.CreateRecordPageModule,
      ),
  },
  {
    path: 'view-hires',
    loadChildren: () =>
      import('./talent/view-hires/view-hires.module').then(
        (m) => m.ViewHiresPageModule,
      ),
  },
  {
    path: 'market-price-preposition',
    loadChildren: () =>
      import('./talent/market-price-preposition/market-price-preposition.module').then(
        (m) => m.MarketPricePrepositionPageModule,
      ),
  },
  {
    path: 'utilities',
    // load the page component directly so the module's own routing is not
    // invoked; avoids registering a stray empty child path when the module
    // is imported elsewhere (see scouter/talent modules).
    loadComponent: () =>
      import('./utilities/utilities.page').then((m) => m.UtilitiesPage),
  },
  {
    path: 'scouter/profile',
    component: ProfilePageComponent,
    canActivate: [ProtectedRouteGuard],
  },
  {
    path: 'scouter/account-activation',
    component: AccountActivationPageComponent,
    canActivate: [ProtectedRouteGuard],
  },
  {
    path: 'scouter/view-hires',
    component: ViewAllHiresPageComponent,
    canActivate: [ProtectedRouteGuard],
  },
  {
    path: 'scouter/hire-talent',
    component: HireTalentPageComponent,
    canActivate: [ProtectedRouteGuard],
  },

  // ========== SCOUTER WALLET ROUTES ==========
  {
    path: 'scouter/wallet-page',
    component: WalletPageComponent,
    data: { role: 'scouter' },
  },
  {
    path: 'scouter/wallet-page/wallet-profile',
    component: WalletProfileComponent,
    data: { role: 'scouter' },
  },
  {
    path: 'scouter/wallet-page/fund-wallet',
    component: FundWalletComponent,
    data: { role: 'scouter' },
  },
  {
    path: 'scouter/wallet-page/withdraw-funds',
    component: WithdrawFundComponent,
    data: { role: 'scouter' },
  },
  {
    path: 'scouter/wallet-page/fund-transfer',
    component: FundTransferComponent,
    data: { role: 'scouter' },
  },

  // ========== TALENT WALLET ROUTES ==========
  {
    path: 'talent/wallet-page',
    component: WalletPageComponent,
    data: { role: 'talent' },
  },
  {
    path: 'talent/wallet-page/wallet-profile',
    component: WalletProfileComponent,
    data: { role: 'talent' },
  },
  {
    path: 'talent/wallet-page/fund-wallet',
    component: FundWalletComponent,
    data: { role: 'talent' },
  },
  {
    path: 'talent/wallet-page/withdraw-funds',
    component: WithdrawFundComponent,
    data: { role: 'talent' },
  },
  {
    path: 'talent/wallet-page/fund-transfer',
    component: FundTransferComponent,
    data: { role: 'talent' },
  },

  // ========== COMMON REQUEST ROUTES (shared between roles) ==========
  {
    path: ':role/wallet-page/fund-wallet/fund-wallet-request/:id',
    component: FundWalletRequestPageComponent,
  },
  {
    path: ':role/wallet-page/withdraw-funds/withdraw-funds-request/:id',
    component: WithdrawFundsRequestPageComponent,
  },
  {
    path: ':role/wallet-page/fund-transfer/fund-transfer-request/:id',
    component: TransferFundsRequestPageComponent,
  },

  // ========== OTHER SCOUTER-SPECIFIC ROUTES ==========
  {
    path: 'scouter/market-engagement-market-price-preparation/:id',
    component: MarketEngagementMarketPricePreparationComponent,
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
  providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }],
})
export class AppRoutingModule {}
