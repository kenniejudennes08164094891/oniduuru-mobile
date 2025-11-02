import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { OnboardingPageRoutingModule } from './onboarding-routing.module';
import { OnboardingPage } from './onboarding.page';
import { TalentDetailsComponent } from './talent-details/talent-details.component';
import { OtherDetailsComponent } from './other-details/other-details.component';
import { LoginCredentialsComponent } from './login-credentials/login-credentials.component';
import { VerifyCredentialsComponent } from './verify-credentials/verify-credentials.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OnboardingPageRoutingModule   // ✅ add this line back
  ],
  declarations: [
    OnboardingPage,
    TalentDetailsComponent,
    OtherDetailsComponent,
    LoginCredentialsComponent,
    VerifyCredentialsComponent
  ]
})
export class OnboardingPageModule {}
