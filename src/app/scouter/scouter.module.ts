import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScouterPageRoutingModule } from './scouter-routing.module';
import { ScouterPage } from './scouter.page';
import { ScouterDashboardComponent } from './scouter-dashboard/scouter-dashboard.component';
import { TalentPageModule } from '../talent/talent.module';
import { ScouterHeaderComponent } from './scouter-header/scouter-header.component';
import { ProfilePopupSettingsModalComponent } from '../utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from '../utilities/modals/notifications-popup-modal/notifications-popup-modal.component';
import { LogComplaintsPopupModalComponent } from '../utilities/modals/log-complaints-popup-modal/log-complaints-popup-modal.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { AccountActivationPageComponent } from './account-activation-page/account-activation-page.component';
import { UploadScreenshotPopupModalComponent } from '../utilities/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
import { UpdateProfileConfirmationPopupModalComponent } from '../utilities/modals/update-profile-confirmation-popup-modal/update-profile-confirmation-popup-modal.component';
import { ViewAllHiresPageComponent } from './view-all-hires-page/view-all-hires-page.component';
import { HireTalentPageComponent } from './hire-talent-page/hire-talent-page.component';
import { WalletPageComponent } from './wallet-page/wallet-page.component';
import { AwaitingPaymentVerificationModalComponent } from '../utilities/modals/awaiting-payment-verification-modal/awaiting-payment-verification-modal.component';
import { MarketEngagementMarketPricePreparationComponent } from './market-engagement-market-price-preparation/market-engagement-market-price-preparation.component';
import { RecentHiresDashboardComponent } from '../utilities/modals/recent-hires-dashboard-component/recent-hires-dashboard-component.component';
import { RecentMarketRatingDashboardComponent } from '../utilities/modals/recent-market-rating-dashboard-component/recent-market-rating-dashboard-component.component';
import { NgChartsModule } from 'ng2-charts';
import { MarketEngagementTabsComponent } from '../utilities/modals/market-engagement-tabs-switch/market-engagement-tabs.component';
import { MarketStatsComponent } from '../utilities/modals/market-stats/market-stats.component';
import { MarketEngagementsTableComponent } from '../utilities/modals/market-engagements-table/market-engagements-table.component';
import { TotalDeliveryEvaluationComponent } from '../utilities/modals/total-delivery-evaluation/total-delivery-evaluation.component';
import { SlideshowTextForViewHiresComponent } from '../utilities/modals/slideshow-text-for-view-hires/slideshow-text-for-view-hires.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScouterPageRoutingModule,
    TalentPageModule,
    NgChartsModule,
  ],
  declarations: [
    ScouterPage,
    ScouterHeaderComponent,
    ScouterDashboardComponent,
    ProfilePopupSettingsModalComponent,
    NotificationsPopupModalComponent,
    LogComplaintsPopupModalComponent,
    ProfilePageComponent,
    AccountActivationPageComponent,
    UploadScreenshotPopupModalComponent,
    UpdateProfileConfirmationPopupModalComponent,
    ViewAllHiresPageComponent,
    HireTalentPageComponent,
    WalletPageComponent,
    AwaitingPaymentVerificationModalComponent,
    MarketEngagementMarketPricePreparationComponent,
    RecentHiresDashboardComponent,
    RecentMarketRatingDashboardComponent,
    MarketEngagementMarketPricePreparationComponent,
    MarketEngagementTabsComponent,
    MarketStatsComponent,
    MarketEngagementsTableComponent,
    TotalDeliveryEvaluationComponent,
    SlideshowTextForViewHiresComponent,
  ],
  exports: [TotalDeliveryEvaluationComponent],
})
export class ScouterPageModule {}
