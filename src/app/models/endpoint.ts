export const endpoints = {
  //Authentication and onboarding
  onboardTalent: 'talent/v1/create-talent-profile',
  onboardScouter: 'scouters/v1/create-scouter-profile',

  userLogin: 'login/v1/auth/signin',
  logoutUser: 'login/v1/auth/logout-user',
  getAllLoggedInUsers: 'login/v1/auth/get-login-logs',
  getMostFrequentLoggedInUsers: 'login/v1/auth/most-frequent-loggedIn-users',
  verifyOTP: 'login/v1/auth/verifyOTP',
  resendOTP: 'login/v1/auth/resendOTP',
  forgotPasswords: 'login/v1/auth/forgot-passwords',
  verifyUserEmail: 'admin/v1/admin/validateUserEmail',

  createTalentSecurityQuestions:
    'login/v1/auth/create-talent-security-questions',
  createScouterSecurityQuestions:
    'login/v1/auth/create-scouter-security-questions',
  getMySecurityQuestions: 'login/v1/auth/get-my-security-questions',
  getMySecurityQuestionsWithAnswers: 'login/v1/auth/security-questions-answers',
  validateTalentSecurityQuestion:
    'login/v1/auth/validate-talent-security-questions',
  validateScouterSecurityQuestions:
    'login/v1/auth/validate-scouter-security-questions',
  updateTalentSecurityQuestions:
    'login/v1/auth/update-talent-security-questions',
  updateScouterSecurityQuestions:
    'login/v1/auth/update-scouter-security-questions',

  //dashboard
  scouterDashboardStats: 'dashboard/v1/dashboard-statistics/get-scouter-stats',
  talentDashboardStats: 'dashboard/v1/dashboard-statistics/get-talent-stats',
  scouterTalentStats:
    'dashboard/v1/dashboard-statistics/get-scouter-talent-stats',
  allStatusStats: 'dashboard/v1/dashboard-statistics/get-status-stats',
  allPaymentStats: 'dashboard/v1/dashboard-statistics/get-payment-stats',
  allMarketStats: 'dashboard/v1/dashboard-statistics/get-market-stats',

  //markets
  fetchAllMarkets: 'market/v1/get-all-markets',
  getMarketsByScouterId: 'market/v1/get-all-markets/scouter',
  getMarketsByTalentId: 'market/v1/get-all-markets/talent',
  getTalentMarketProfile: 'market/v1/talent-market-profile/fetch-one',
  hireTalent: 'market/v1/hire-talent',
  scouterMarketWithTalent:
    'dashboard/v1/dashboard-statistics/get-scouter-talent-stats',
  talentMarketGrading: 'market/v1/talent-market-grading/scouter',
  createTalentMarketProfile: 'market/v1/talent-market-profile/create',
  updateTalentMarketProfile: 'market/v1/talent-market-profile/update-bio',
  toggleMarketOffer: 'market/v1/toggle-market-status',
  marketByTimeFrame: 'market/v1/get-all-markets/filter-by-time',
  getMarketsByDateInterval: 'market/v1/get-all-markets/filter-by-date-interval',
  getSingleMarket: 'market/v1/get-single-market',

  //scouter
  fetchScouterProfile: 'scouters/v1/fetch-scouter-profile',
  updateScouterProfile: 'scouters/v1/edit-scouter-profile',
  uploadProfilePic: 'scouters/v1/upload-profile-picture',
  updateProfilePic: 'scouters/v1/update-profile-picture',
  getPictureByScouterId: 'scouters/v1/get-profile-picture',
  deleteProfilePicture: 'scouters/v1/delete-scouter-picture',
  verifyPayment: 'scouters/v1/verify-payment-status',
  scouterPaymentRecipt: 'scouters/v1/fetch-scouter-receipt',
  getGeoLocale: 'maps/api/geocode/json',
  scouterComment: 'market/v1/market-comment/scouter',
  fetchAllScouters: 'scouters/v1/fetch-all-scouters',
  toggleScouterStatus: 'scouters/v1/toggle-scouter-status',
  toggleScouterPaymentStatus: 'scouters/v1/toggle-scouter-payment-status',
  filterScouterParam: 'scouters/v1/filter-scouter-param',

  //talents
  fetchTalentProfile: 'talent/v1/fetch-talent-profile',
  updateTalentProfile: 'talent/v1/edit-talent-profile',
  fetchAllTalentSkillsets: 'talent/v1/fetch-all-skillsets',
  fetchDropdownItems: 'talent/v1/dropdown-items',
  fetchAllTalents: 'talent/v1/fetch-all-talents',
  filterSkillLevel: 'talent/v1/filter-defined-skillsets',
  getTalentReel: 'talent/v1/get-reel-data-uploaded',
  deleteTalentProfilePicture: 'talent/v1/delete-talent-picture',
  uploadTalentProfilePic: 'talent/v1/upload-profile-picture',
  updateTalentProfilePic: 'talent/v1/update-talent-profile-picture',
  getPictureByTalentId: 'talent/v1/get-profile-picture',
  uploadTalentReel: 'talent/v1/upload-reel',
  replaceTalentReel: 'talent/v1/replace-reel',
  displayRetrievedReel: 'talent/v1/display-retrieved-reel',
  talentComment: 'market/v1/market-comment/talent',
  toogleTalentStatus: 'talent/v1/toggle-talent-status',
  filterTalentParam: 'talent/v1/filter-talent-param',

  //admin
  verifyScouterPayment: 'scouters/v1/fetch-all-payment-receipts',
  accountActivatiomAmount: 'admin/v1/admin/account-activation-amount',
  filterInactveUsers: 'admin/v1/admin/filter-inactive-users',

  //push notification
  getMyNotifications: 'utility/v1/get-all-notifications',
  createBulkNotification: 'utility/v1/bulk-notification',
  clearMyNotifications: 'utility/v1/clear-my-notifications',

  // customer complaints
  logComplaint: 'utility/v1/log-complaints',
  viewAllCustomerComplaints: 'utility/v1/customer-complaints/fetch-all',
  viewSingleCustomerComplaints: 'utility/v1/customer-complaints/fetch-one',
  toggleComplaintStatus: 'utility/v1/toggle-complaint-status',

  //wallets service
  validateMyBVN: 'api-service/verify-bvn',
  validateMyNIN: 'api-service/verify-nin',
  getNubanBanks: 'api-service/get-nigerian-banks',
  verifyAcctNum: 'api-service/verify-account-number',
  createWalletAccount: 'wallets/v1/create-wallet-profile',
  fetchMyWallet: 'wallets/v1/fetch-my-wallet',
  fundsDeposit: 'wallets/v1/deposit-funds',
  fetchMyDeposits: 'wallets/v1/fetch-my-deposits',
  fetchSingleDeposit: 'wallets/v1/fetch-single-deposit',
  calculateCharge: 'wallets/v1/calculate-transaction-charge',
  withdrawFunds: 'wallets/v1/withdraw-funds',
  fetchMyWithdrawals: 'wallets/v1/fetch-my-withdrawals',
  fetchSingleWithdrawal: 'wallets/v1/fetch-single-withdrawal',
  transferFunds: 'wallets/v1/transfer-funds',
  fetchMyTransfers: 'wallets/v1/fetch-my-transfers',
  fetchSingleTransfer: 'wallets/v1/fetch-single-transfer',
  walletStats: 'wallets/v1/my-wallet-stats',
  histogramData: 'wallets/v1/my-monthly-stats',
  adminHistogramData: 'wallets/v1/all-monthly-stats',
  adminWalletStats: 'wallets/v1/all-wallet-stats',
  adminFetchAllWallets: 'wallets/v1/fetch-all-wallets',
  adminToggleUserWallet: 'wallets/v1/toggle-wallet-status',
  adminViewAllDeposits: 'wallets/v1/fetch-all-deposits',
  adminViewSingleDeposits: 'wallets/v1/admin/fetch-single-deposit',
  adminToggleFundDeposits: 'wallets/v1/toggle-fund-deposits',
  adminViewAllFundWithdrawals: 'wallets/v1/fetch-all-withdrawals',
  adminFetchAllWithdrawals: 'wallets/v1/fetch-all-withdrawals',
  adminFetchSingleWithdrawal: 'wallets/v1/admin/fetch-single-withdrawal',
  adminToggleFundWithdrawal: 'wallets/v1/toggle-fund-withdrawal',
  adminFetchAllFundsTransfers: 'wallets/v1/admin/fetch-all-transfers',

  // utils
  getAllCountryFlags: 'api-service/fetch-all-countries',
  cloudinaryGetSecrets: 'utility/v1/cloudinary/signature',
};
