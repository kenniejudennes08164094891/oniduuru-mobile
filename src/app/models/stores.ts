import { TabItems } from './mocks';
export const accountOptions = [
  {
    option: 'Talent Signup',
    matIcon: 'build',
    route: '/talent/talent-signup',
    param: 'talent_onboarding',
  },
  {
    option: 'Scouter Signup',
    matIcon: 'credit_card',
    route: '/scouter/scouter-signup',
    param: 'scouter_onboarding',
  },
];

export const imageIcons = {
  scouterImage: '/assets/images/scouter.jpg',
  talentImage: '/assets/images/talent.png',
  NotificationIcon: '/assets/icon/Notification-Icon.svg',
  ProfileIcon: '/assets/images/Profile-Icon.svg',
  InfoIcon: '/assets/icon/Info-Icon.svg',
  NoDataImage: '/assets/images/NoDataImage.svg',
};

export const talentOnboardingTabItems: TabItems[] = [
  {
    path: 'talent-details',
    ionIcon: 'person-circle-outline',
    routerLink: '/talent/create-account/talent-details',
  },
  {
    path: 'talent-other-details',
    ionIcon: 'list-outline',
    routerLink: '/talent/create-account/talent-other-details',
  },
  {
    path: 'talent-login-credentials',
    ionIcon: 'key-outline',
    routerLink: '/talent/create-account/talent-login-credentials',
  },
  {
    path: 'talent-verify-credentials',
    ionIcon: 'shield-checkmark-outline',
    routerLink: '/talent/create-account/talent-verify-credentials',
  },
];

export const dummyLogin = [
  {
    email: 'scouter@oniduuru.com',
    password: 'scouter',
    role: 'scouter',
    route: '/scouter/dashboard',
  },
  {
    email: 'talent@oniduuru.com',
    password: 'talent',
    role: 'talent',
    route: '/talent/dashboard',
  },
];
