import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'welcome-page',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'welcome-page',
    pathMatch: 'full'
  },
    // { path: '**', redirectTo: 'preview' },  
     {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then( m => m.AuthPageModule)
  },
  {
    path: 'scouter',
    loadChildren: () => import('./scouter/scouter.module').then( m => m.ScouterPageModule)
  },
  {
    path: 'talent',
    loadChildren: () => import('./talent/talent.module').then( m => m.TalentPageModule)
  },
  {
    path: 'utilities',
    loadChildren: () => import('./utilities/utilities.module').then( m => m.UtilitiesPageModule)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
