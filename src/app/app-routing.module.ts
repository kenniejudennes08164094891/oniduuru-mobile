import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ProfilePageComponent } from './scouter/profile-page/profile-page.component';
import { AccountActivationPageComponent } from './scouter/account-activation-page/account-activation-page.component';

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
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
