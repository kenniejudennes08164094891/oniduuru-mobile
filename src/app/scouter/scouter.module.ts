import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScouterPageRoutingModule } from './scouter-routing.module';
import { ScouterPage } from './scouter.page';
import { ScouterDashboardComponent } from './scouter-dashboard/scouter-dashboard.component';
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
import { WalletProfileComponent } from './wallet-profile/wallet-profile.component';
import { FundWalletComponent } from './fund-wallet/fund-wallet.component';
import { WithdrawFundComponent } from './withdraw-fund/withdraw-fund.component';
import { FundTransferComponent } from './fund-transfer/fund-transfer.component';
import { WelcomeToOniduuruMarketplacePageComponent } from './welcome-to-oniduuru-marketplace-page/welcome-to-oniduuru-marketplace-page.component';
import { ViewAllTalentsPageComponent } from './view-all-talents-page/view-all-talents-page.component';
import { TalentPageModule } from '../talent/talent.module';
import { UtilitiesPageModule } from '../utilities/utilities.module';
import { SpinnerComponent } from '../utilities/spinner/spinner.component';
import { ViewAllTalentsPopupModalComponent } from '../utilities/modals/view-all-talents-popup-modal/view-all-talents-popup-modal.component';
import { ViewAllTalentsSwitchTabComponent } from '../utilities/modals/view-all-talents-switch-tab/view-all-talents-switch-tab.component';
import { RecentReviewsTabComponent } from '../utilities/modals/recent-reviews-tab/recent-reviews-tab.component';
import { ReelsAndDocumentationTabComponent } from '../utilities/modals/reels-and-documentation-tab/reels-and-documentation-tab.component';
import { SkillSetTabComponent } from '../utilities/modals/skill-set-tab/skill-set-tab.component';
import { ViewTalentsLocationPageComponent } from './view-talents-location-page/view-talents-location-page.component';
import { FindProfessionalsByLocationModalComponent } from '../utilities/modals/find-professionals-by-location-modal/find-professionals-by-location-modal.component';
import { ProceedToHireTalentPopupModalComponent } from '../utilities/modals/proceed-to-hire-talent-popup-modal/proceed-to-hire-talent-popup-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScouterPageRoutingModule,
    TalentPageModule,
    NgChartsModule,
    UtilitiesPageModule,
    SpinnerComponent,
  ],
  declarations: [
    ScouterHeaderComponent,
    ScouterPage,
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
    WalletProfileComponent,
    FundWalletComponent,
    WithdrawFundComponent,
    FundTransferComponent,
    WelcomeToOniduuruMarketplacePageComponent,
    ViewAllTalentsPageComponent,
    ViewAllTalentsPopupModalComponent,
    ViewAllTalentsSwitchTabComponent,
    RecentReviewsTabComponent,
    ReelsAndDocumentationTabComponent,
    SkillSetTabComponent,
    ViewTalentsLocationPageComponent,
    FindProfessionalsByLocationModalComponent,
    ProceedToHireTalentPopupModalComponent,
  ],
  exports: [TotalDeliveryEvaluationComponent],
})
export class ScouterPageModule {}
