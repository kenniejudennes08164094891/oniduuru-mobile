import { Type } from '@angular/core';

export interface DeviceView {
  title?: string;
  route: string;
  iosComponent: Type<any>;
  androidComponent: Type<any>;
  selector?: string;
}

export interface TabItems {
  path: string;
  ionIcon: string;
  routerLink?: string;
}
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SkillSet {
  jobTitle: string;
  skillLevel: string;
  amount: number;
}
export interface SkillSet {
  jobTitle: string;
  skillLevel: string;
  amount: number;
}

// Define the Review structure
export interface RecentReview {
  profilePic: string;
  name: string;
  comment: string;
  date: string;
  yourRating: number;
}

export interface Location {
  lat: any;
  lng: any;
  city: string;
}

export interface InactiveUsersParam {
  role: string;
  durationInMonths: number;
}

export interface FilterScouterParam {
  key: string;
  param: string;
}

export interface ComplaintStatus {
  status: string;
}

export interface BulkNotificationParams {
  senderId: string;
  receiverId: string[];
  message: string;
}

export interface WalletProfileParams {
  wallet_id?: string | undefined | any;
  uniqueId?: string | undefined | any;
}

export interface PaginationParams {
  skillset?: string[] | any;
  location?: string | any;
  skillLevel?: string | any;
  search?: string | any;
  limit: number;
  pageNo: number;
  statusParams?: string | any;
}

export interface MockPayment {
  id: string;
  profilePic: string;
  name: string;
  email: string;
  date: string;
  startDate: string;
  amount: number;
  offerStatus: 'Offer Accepted' | 'Awaiting Acceptance' | 'Offer Rejected';
  status: 'Active' | 'Pending' | 'Away';
  jobDescription?: string;
  yourComment?: string;
  yourRating: number;
  talentComment?: string;
  talentRating: number;
  proximity: string;
  payRange: string;
  aboutTalent: string;
  video: File | null | string; // one video
  pictures: string[];
  skillSet: SkillSet[]; // 👈 multiple jobs per user
  recentReview: RecentReview[];
  location: Location;
}

export const MockRecentHires: MockPayment[] = [
  {
    id: '1',
    profilePic:
      'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    name: 'John Doe',
    email: 'JohnDoe@gmail.com',
    date: 'Sep 10, 2025, 11:45 AM',
    startDate: 'Jan 1, 2025',
    amount: 700000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'I need a software dev for my startup.',
    yourComment: 'John did a great work',
    yourRating: 4,
    talentComment: 'N/A',
    talentRating: 5,
    proximity: '12 Henry Uzuoma Street, Awoyaya Lagos',
    payRange: '₦500k - ₦1Million',
    aboutTalent: 'Full-stack developer with passion for problem-solving.',
    video:
      'https://videos.pexels.com/video-files/3209833/3209833-uhd_2560_1440_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184611/pexels-photo-3184611.jpeg',
      'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg',
      'https://images.pexels.com/photos/3778680/pexels-photo-3778680.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Frontend Developer',
        skillLevel: 'Intermediate',
        amount: 5000000,
      },
      {
        jobTitle: 'Backend Developer',
        skillLevel: 'Intermediate',
        amount: 6000000,
      },
      {
        jobTitle: 'UI/UX Designer',
        skillLevel: 'Intermediate',
        amount: 600000,
      },
      {
        jobTitle: 'Data Analyst',
        skillLevel: 'Intermediate',
        amount: 6000000,
      },
      {
        jobTitle: 'Marketing Strategist',
        skillLevel: 'Intermediate',
        amount: 600000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Sarah Johnson',
        comment: 'Sarah was punctual and exceeded expectations.',
        date: 'Sep 12, 2025, 9:20 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        name: 'David Kim',
        comment: 'Good communication but slightly delayed delivery.',
        date: 'Sep 13, 2025, 3:45 PM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'Maria Lopez',
        comment: 'Great attention to detail, will hire again.',
        date: 'Sep 14, 2025, 11:15 AM',
        yourRating: 4,
      },
    ],
    location: { lat: 6.517, lng: 3.394, city: 'Lagos' },
  },
  {
    id: '2',
    profilePic:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    name: 'Jane Smith',
    email: 'Janesmt@gmail.com',
    date: 'Sep 9, 2025, 03:15 PM',
    startDate: 'Jan 9, 2025',
    amount: 500000.0,
    offerStatus: 'Awaiting Acceptance',
    status: 'Active',
    jobDescription: 'Frontend designer role for ecommerce app.',
    yourComment: 'Still waiting for confirmation',
    yourRating: 0,
    talentComment: 'Looking forward to working!',
    talentRating: 0,
    proximity: '16 Henry Uzuoma Street, Awoyaya Lagos',
    payRange: 'Above ₦1 Million',
    aboutTalent: 'Frontend developer and UI designer.',
    video:
      'https://videos.pexels.com/video-files/856675/856675-hd_1920_1080_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg',
      'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
      'https://images.pexels.com/photos/3760742/pexels-photo-3760742.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Frontend Developer',
        skillLevel: 'Advanced',
        amount: 800000,
      },
      { jobTitle: 'UI/UX Designer', skillLevel: 'Expert', amount: 1000000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        name: 'James Carter',
        comment: 'James handled the project professionally.',
        date: 'Sep 15, 2025, 10:05 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
        name: 'Emily Chen',
        comment: 'Responsive and skilled, but can improve time management.',
        date: 'Sep 16, 2025, 6:30 PM',
        yourRating: 4,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/3771837/pexels-photo-3771837.jpeg',
        name: 'Michael Brown',
        comment: 'Delivered exactly what was promised.',
        date: 'Sep 17, 2025, 8:00 AM',
        yourRating: 5,
      },
    ],
    location: { lat: 6.5244, lng: 3.3792, city: 'Lagos' },
  },
  {
    id: '3',
    profilePic:
      'https://images.pexels.com/photos/936229/pexels-photo-936229.jpeg',
    name: 'Michael Johnson',
    email: 'MichaelJohnson@gmail.com',
    date: 'Sep 8, 2025, 09:30 AM',
    startDate: 'Feb 1, 2025',
    amount: 23475.0,
    offerStatus: 'Offer Rejected',
    status: 'Pending',
    jobDescription: 'Backend developer needed for finance app.',
    yourComment: 'Did not meet project requirements',
    yourRating: 2,
    talentComment: 'Thanks for the opportunity',
    talentRating: 3,
    proximity: '10 Oyedele Oguniyi Street, Anthony Lagos',
    payRange: '₦750k - ₦950k',
    aboutTalent: 'Backend engineer passionate about scalable systems.',
    video:
      'https://videos.pexels.com/video-files/1526909/1526909-uhd_2560_1440_30fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg',
      'https://images.pexels.com/photos/756231/pexels-photo-756231.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Backend Developer',
        skillLevel: 'Professional',
        amount: 800000,
      },
      {
        jobTitle: 'Database Engineer',
        skillLevel: 'Intermediate',
        amount: 650000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/1181414/pexels-photo-1181414.jpeg',
        name: 'Olivia White',
        comment: 'Creative and easy to collaborate with.',
        date: 'Sep 18, 2025, 2:45 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        name: 'Daniel Lee',
        comment: 'Work quality was good but revisions were needed.',
        date: 'Sep 19, 2025, 1:10 PM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Sophia Turner',
        comment: 'Delivered ahead of schedule, very professional.',
        date: 'Sep 20, 2025, 5:25 PM',
        yourRating: 5,
      },
    ],

    location: { lat: 6.5244, lng: 3.3792, city: 'Lagos Island' }, // Lagos Island
  },
  {
    id: '4',
    profilePic:
      'https://images.pexels.com/photos/774095/pexels-photo-774095.jpeg',
    name: 'Emily Davis',
    email: 'Emily@gmail.com',
    date: 'Sep 7, 2025, 07:50 PM',
    startDate: 'Dec 1, 2025',
    amount: 234599.99,
    offerStatus: 'Offer Accepted',
    status: 'Away',
    jobDescription: 'Mobile app designer for fintech project.',
    yourComment: 'Great collaboration so far',
    yourRating: 0,
    talentComment: 'Excited to join!',
    talentRating: 0,
    proximity: '20 Martins Street, Olosha Lagos',
    payRange: '₦50k - ₦100k',
    aboutTalent: 'Creative mobile app designer with fintech experience.',
    video:
      'https://videos.pexels.com/video-files/854171/854171-hd_1920_1080_30fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184355/pexels-photo-3184355.jpeg',
      'https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Mobile UI Designer',
        skillLevel: 'Intermediate',
        amount: 450000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
        name: 'Robert King',
        comment: 'Solid work overall, minor improvements needed.',
        date: 'Sep 21, 2025, 9:40 AM',
        yourRating: 4,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
        name: 'Hannah Scott',
        comment: 'Friendly and professional, great outcome.',
        date: 'Sep 22, 2025, 7:55 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg',
        name: 'Chris Evans',
        comment: 'Met expectations, would recommend to others.',
        date: 'Sep 23, 2025, 4:30 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 6.4654, lng: 3.4064, city: 'Lagos, Victoria Island' }, // Victoria Island
  },
  {
    id: '5',
    profilePic:
      'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
    name: 'Robert Wilson',
    email: 'RobertW@protonmail.com',
    date: 'Sep 6, 2025, 02:20 PM',
    startDate: 'Mar 15, 2025',
    amount: 320000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'Full-stack developer for SaaS platform.',
    yourComment: 'Excellent technical skills',
    yourRating: 5,
    talentComment: 'Great team and project',
    talentRating: 5,
    proximity: '256 Mbadiwe Close, Ikoyi Lagos',
    payRange: '₦500k - ₦1Million',
    aboutTalent: 'Full-stack developer skilled in SaaS.',
    video:
      'https://videos.pexels.com/video-files/45208/45208-hd_1280_720_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg',
      'https://images.pexels.com/photos/3184612/pexels-photo-3184612.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Full-Stack Developer',
        skillLevel: 'Expert',
        amount: 950000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
        name: 'Laura Smith',
        comment: 'Very creative solutions, highly recommended.',
        date: 'Sep 24, 2025, 1:15 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Kevin Adams',
        comment: 'Decent job, but could improve communication.',
        date: 'Sep 25, 2025, 10:45 AM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'Jessica Lee',
        comment: 'Quick turnaround, very reliable.',
        date: 'Sep 26, 2025, 8:30 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 6.4431, lng: 3.3919, city: 'Lagos' }, // Lekki
  },
  {
    id: '6',
    profilePic:
      'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    name: 'Sophia Brown',
    email: 'SophiaB@gmail.com',
    date: 'Sep 5, 2025, 10:10 AM',
    startDate: 'Apr 10, 2025',
    amount: 450000.0,
    offerStatus: 'Awaiting Acceptance',
    status: 'Active',
    jobDescription: 'UI/UX designer for travel booking platform.',
    yourComment: 'Pending confirmation',
    yourRating: 0,
    talentComment: 'Happy to take this opportunity',
    talentRating: 0,
    proximity: '12 Adeola Odeku, Victoria Island Lagos',
    payRange: '₦400k - ₦600k',
    aboutTalent: 'Passionate UI/UX designer.',
    video:
      'https://videos.pexels.com/video-files/1448733/1448733-uhd_2560_1440_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg',
      'https://images.pexels.com/photos/3182765/pexels-photo-3182765.jpeg',
    ],
    skillSet: [
      { jobTitle: 'UI/UX Designer', skillLevel: 'Expert', amount: 700000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
        name: 'Mark Williams',
        comment: 'Fantastic work ethic and very professional.',
        date: 'Sep 27, 2025, 7:20 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
        name: 'Rachel Green',
        comment: 'Job was okay, but not outstanding.',
        date: 'Sep 28, 2025, 11:50 AM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
        name: 'Andrew Miller',
        comment: 'Great collaboration, easy to work with.',
        date: 'Sep 29, 2025, 9:40 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 6.4969, lng: 3.3673, city: 'Lagos, Surulere' }, // Surulere
  },
  {
    id: '7',
    profilePic:
      'https://images.pexels.com/photos/2379007/pexels-photo-2379007.jpeg',
    name: 'Daniel Lee',
    email: 'DanLee@gmail.com',
    date: 'Sep 4, 2025, 06:40 PM',
    startDate: 'May 2, 2025',
    amount: 600000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'Backend developer for logistics platform.',
    yourComment: 'Strong performer, reliable delivery',
    yourRating: 5,
    talentComment: 'Great collaboration so far',
    talentRating: 5,
    proximity: 'Ikorodu Road, Lagos',
    payRange: '₦600k - ₦900k',
    aboutTalent: 'Backend engineer skilled in Node.js.',
    video:
      'https://videos.pexels.com/video-files/2022395/2022395-uhd_2560_1440_24fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg',
    ],
    skillSet: [
      { jobTitle: 'Backend Developer', skillLevel: 'Advanced', amount: 750000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        name: 'Sophia Clark',
        comment: 'Delivered more than expected.',
        date: 'Sep 30, 2025, 2:20 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'Daniel Moore',
        comment: 'Satisfactory job but response time was slow.',
        date: 'Oct 01, 2025, 4:15 PM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/1181414/pexels-photo-1181414.jpeg',
        name: 'Grace Hill',
        comment: 'Amazing attention to detail.',
        date: 'Oct 02, 2025, 8:30 AM',
        yourRating: 5,
      },
    ],
    location: { lat: 6.455, lng: 3.3972, city: 'Lagos, Ikoyi' }, // Ikoyi
  },
  {
    id: '8',
    profilePic:
      'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg',
    name: 'Olivia Martinez',
    email: 'OliviaM@gmail.com',
    date: 'Sep 3, 2025, 09:00 AM',
    startDate: 'Jun 12, 2025',
    amount: 800000.0,
    offerStatus: 'Offer Rejected',
    status: 'Pending',
    jobDescription: 'Frontend engineer for EdTech platform.',
    yourComment: 'Not a good culture fit',
    yourRating: 2,
    talentComment: 'Thankful for the chance',
    talentRating: 3,
    proximity: 'Lekki Phase 1, Lagos',
    payRange: 'Above ₦1 Million',
    aboutTalent: 'Frontend specialist with React.',
    video:
      'https://videos.pexels.com/video-files/855517/855517-hd_1920_1080_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
      'https://images.pexels.com/photos/3184402/pexels-photo-3184402.jpeg',
    ],
    skillSet: [
      { jobTitle: 'Frontend Developer', skillLevel: 'Expert', amount: 950000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Lucas Wright',
        comment: 'Quick learner, adapted well to the project.',
        date: 'Oct 03, 2025, 12:40 PM',
        yourRating: 4,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
        name: 'Ella Martinez',
        comment: 'Good quality but revisions were required.',
        date: 'Oct 04, 2025, 9:55 AM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        name: 'Noah Baker',
        comment: 'Exceptional service and delivery.',
        date: 'Oct 05, 2025, 6:15 PM',
        yourRating: 5,
      },
    ],
    location: { lat: 6.517, lng: 3.394, city: 'Lagos, Ajah' }, // Ajah
  },
  {
    id: '9',
    profilePic:
      'https://images.pexels.com/photos/2379008/pexels-photo-2379008.jpeg',
    name: 'David Clark',
    email: 'DavidC@gmail.com',
    date: 'Sep 2, 2025, 04:25 PM',
    startDate: 'Jul 5, 2025',
    amount: 550000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'DevOps engineer for banking app.',
    yourComment: 'Solid CI/CD setup',
    yourRating: 4,
    talentComment: 'Enjoying the work',
    talentRating: 5,
    proximity: 'Surulere, Lagos',
    payRange: '₦500k - ₦1Million',
    aboutTalent: 'DevOps engineer focused on automation.',
    video:
      'https://videos.pexels.com/video-files/856647/856647-hd_1920_1080_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg',
    ],
    skillSet: [
      { jobTitle: 'DevOps Engineer', skillLevel: 'Advanced', amount: 850000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
        name: 'Mia Johnson',
        comment: 'Very cooperative and professional.',
        date: 'Oct 06, 2025, 10:00 AM',
        yourRating: 4,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg',
        name: 'Ethan Davis',
        comment: 'Work was fine, but delivery was late.',
        date: 'Oct 07, 2025, 5:20 PM',
        yourRating: 2,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
        name: 'Ava Wilson',
        comment: 'Superb work, I’m impressed.',
        date: 'Oct 08, 2025, 7:10 PM',
        yourRating: 5,
      },
    ],
    location: { lat: 6.5241, lng: 3.3793, city: 'Lagos, Marina' }, // Marina
  },
  {
    id: '10',
    profilePic:
      'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    name: 'Ava Taylor',
    email: 'AvaT@gmail.com',
    date: 'Sep 1, 2025, 11:30 AM',
    startDate: 'Aug 1, 2025',
    amount: 700000.0,
    offerStatus: 'Awaiting Acceptance',
    status: 'Active',
    jobDescription: 'Product designer for healthcare app.',
    yourComment: 'Pending acceptance',
    yourRating: 0,
    talentComment: 'Eager to join the project',
    talentRating: 0,
    proximity: 'Mushin, Lagos',
    payRange: '₦600k - ₦1 Million',
    aboutTalent: 'Product designer focused on healthcare apps.',
    video:
      'https://videos.pexels.com/video-files/2098989/2098989-uhd_2560_1440_30fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184361/pexels-photo-3184361.jpeg',
    ],
    skillSet: [
      { jobTitle: 'Product Designer', skillLevel: 'Advanced', amount: 800000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'William Thompson',
        comment: 'Professional attitude, good outcome.',
        date: 'Oct 09, 2025, 8:25 AM',
        yourRating: 4,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/1181414/pexels-photo-1181414.jpeg',
        name: 'Chloe Evans',
        comment: 'Delivered on time, very reliable.',
        date: 'Oct 10, 2025, 1:35 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Liam Parker',
        comment: 'Work was average, expected more.',
        date: 'Oct 11, 2025, 3:50 PM',
        yourRating: 3,
      },
    ],
    location: { lat: 6.5431, lng: 3.3512, city: 'Lagos, Apapa' }, // Apapa
  },
  {
    id: '11',
    profilePic:
      'https://images.pexels.com/photos/936229/pexels-photo-936229.jpeg',
    name: 'Ethan Harris',
    email: 'EthanH@gmail.com',
    date: 'Aug 31, 2025, 08:10 PM',
    startDate: 'Aug 20, 2025',
    amount: 400000.0,
    offerStatus: 'Offer Accepted',
    status: 'Away',
    jobDescription: 'QA engineer for e-commerce website.',
    yourComment: 'Detail-oriented and thorough',
    yourRating: 4,
    talentComment: 'Team has been welcoming',
    talentRating: 4,
    proximity: 'Ajah, Lagos',
    payRange: '₦350k - ₦600k',
    aboutTalent: 'QA engineer skilled in automation.',
    video:
      'https://videos.pexels.com/video-files/3182836/3182836-uhd_2560_1440_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184410/pexels-photo-3184410.jpeg',
    ],
    skillSet: [
      { jobTitle: 'QA Engineer', skillLevel: 'Advanced', amount: 550000 },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
        name: 'Zoe Richardson',
        comment: 'Wonderful job, exceeded my expectations.',
        date: 'Oct 12, 2025, 11:10 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
        name: 'Benjamin Clark',
        comment: 'Did okay, but needs improvement.',
        date: 'Oct 13, 2025, 2:00 PM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
        name: 'Isabella Harris',
        comment: 'Very smooth process and excellent work.',
        date: 'Oct 14, 2025, 6:30 PM',
        yourRating: 5,
      },
    ],
    location: { lat: 6.535, lng: 3.3742, city: 'Lagos, Yaba' }, // Yaba
  },
  {
    id: '12',
    profilePic:
      'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg',
    name: 'Mia Thompson',
    email: 'MiaT@gmail.com',
    date: 'Aug 30, 2025, 01:00 PM',
    startDate: 'Aug 25, 2025',
    amount: 950000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'AI/ML engineer for recommendation system.',
    yourComment: 'Brilliant with ML models',
    yourRating: 5,
    talentComment: 'Challenging but rewarding work',
    talentRating: 5,
    proximity: 'Yaba, Lagos',
    payRange: 'Above ₦1 Million',
    aboutTalent: 'AI/ML engineer specializing in recommendation systems.',
    video:
      'https://videos.pexels.com/video-files/856688/856688-hd_1920_1080_25fps.mp4',

    pictures: [
      'https://images.pexels.com/photos/3184368/pexels-photo-3184368.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Machine Learning Engineer',
        skillLevel: 'Expert',
        amount: 1200000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        name: 'Henry Lewis',
        comment: 'Reliable, but some corrections needed.',
        date: 'Oct 15, 2025, 9:45 AM',
        yourRating: 3,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        name: 'Amelia Walker',
        comment: 'Superb performance, highly skilled.',
        date: 'Oct 16, 2025, 5:20 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'Jack Hall',
        comment: 'Good overall, will hire again.',
        date: 'Oct 17, 2025, 7:40 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 6.4525, lng: 3.39, city: 'Banana Island' }, // Banana Island
  },
  {
    id: '13',
    profilePic:
      'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    name: 'Chinedu Okoro',
    email: 'chinedu.okoro@gmail.com',
    date: 'Sep 15, 2025, 10:30 AM',
    startDate: 'Oct 1, 2025',
    amount: 650000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'Backend developer for fintech application.',
    yourComment: 'Strong technical skills',
    yourRating: 4,
    talentComment: 'Excited about this opportunity',
    talentRating: 5,
    proximity: '12 Nnamdi Azikiwe Road, Enugu',
    payRange: '₦550k - ₦800k',
    aboutTalent: 'Backend developer with expertise in financial systems.',
    video:
      'https://videos.pexels.com/video-files/3198084/3198084-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
      'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Backend Developer',
        skillLevel: 'Advanced',
        amount: 700000,
      },
      {
        jobTitle: 'Database Administrator',
        skillLevel: 'Intermediate',
        amount: 550000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
        name: 'Oluwaseun Adeyemi',
        comment: 'Excellent problem-solving skills.',
        date: 'Oct 18, 2025, 11:20 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Chioma Nwosu',
        comment: 'Delivered quality work ahead of schedule.',
        date: 'Oct 19, 2025, 2:45 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 6.452, lng: 7.51, city: 'Enugu' },
  },
  {
    id: '14',
    profilePic:
      'https://images.pexels.com/photos/1130625/pexels-photo-1130625.jpeg',
    name: 'Aisha Bello',
    email: 'aisha.bello@yahoo.com',
    date: 'Sep 16, 2025, 02:15 PM',
    startDate: 'Oct 5, 2025',
    amount: 480000.0,
    offerStatus: 'Awaiting Acceptance',
    status: 'Active',
    jobDescription: 'UI/UX designer for educational platform.',
    yourComment: 'Impressive portfolio',
    yourRating: 0,
    talentComment: 'Looking forward to your response',
    talentRating: 0,
    proximity: '23 Ahmadu Bello Way, Kaduna',
    payRange: '₦400k - ₦600k',
    aboutTalent:
      'Creative UI/UX designer with focus on educational technology.',
    video:
      'https://videos.pexels.com/video-files/2882110/2882110-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/1181275/pexels-photo-1181275.jpeg',
      'https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'UI/UX Designer',
        skillLevel: 'Intermediate',
        amount: 500000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
        name: 'Tunde Ojo',
        comment: 'Creative designs with great attention to detail.',
        date: 'Oct 20, 2025, 9:30 AM',
        yourRating: 4,
      },
    ],
    location: { lat: 10.516, lng: 7.438, city: 'Kaduna' },
  },
  {
    id: '15',
    profilePic:
      'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg',
    name: 'Emeka Nwankwo',
    email: 'emeka.nwankwo@outlook.com',
    date: 'Sep 17, 2025, 09:45 AM',
    startDate: 'Oct 10, 2025',
    amount: 850000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'Full-stack developer for e-commerce platform.',
    yourComment: 'Extensive experience with e-commerce systems',
    yourRating: 5,
    talentComment: 'Ready to start immediately',
    talentRating: 5,
    proximity: '15 Okpara Avenue, Enugu',
    payRange: '₦700k - ₦1.2M',
    aboutTalent: 'Full-stack developer specialized in e-commerce solutions.',
    video:
      'https://videos.pexels.com/video-files/3184328/3184328-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3182816/pexels-photo-3182816.jpeg',
      'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Full-Stack Developer',
        skillLevel: 'Expert',
        amount: 950000,
      },
      {
        jobTitle: 'E-commerce Specialist',
        skillLevel: 'Advanced',
        amount: 800000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        name: 'Funmi Adebayo',
        comment: 'Exceptional technical skills and reliable delivery.',
        date: 'Oct 21, 2025, 3:15 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Bola Hassan',
        comment: 'Went above and beyond requirements.',
        date: 'Oct 22, 2025, 10:40 AM',
        yourRating: 5,
      },
    ],
    location: { lat: 6.335, lng: 5.623, city: 'Benin City' },
  },
  {
    id: '16',
    profilePic:
      'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
    name: 'Fatima Yusuf',
    email: 'fatima.yusuf@gmail.com',
    date: 'Sep 18, 2025, 04:20 PM',
    startDate: 'Oct 15, 2025',
    amount: 550000.0,
    offerStatus: 'Offer Rejected',
    status: 'Pending',
    jobDescription: 'Frontend developer for healthcare app.',
    yourComment: 'Good skills but declined our offer',
    yourRating: 4,
    talentComment: 'Accepted another position',
    talentRating: 4,
    proximity: '8 Sultan Road, Kano',
    payRange: '₦500k - ₦700k',
    aboutTalent:
      'Frontend developer with experience in healthcare applications.',
    video:
      'https://videos.pexels.com/video-files/3184329/3184329-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3184419/pexels-photo-3184419.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Frontend Developer',
        skillLevel: 'Intermediate',
        amount: 600000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'Ibrahim Musa',
        comment: 'Clean code and good communication.',
        date: 'Oct 23, 2025, 1:50 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 12.002, lng: 8.592, city: 'Kano' },
  },
  {
    id: '17',
    profilePic:
      'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg',
    name: 'Obinna Eze',
    email: 'obinna.eze@protonmail.com',
    date: 'Sep 19, 2025, 11:10 AM',
    startDate: 'Oct 20, 2025',
    amount: 720000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'DevOps engineer for cloud infrastructure.',
    yourComment: 'Strong background in AWS and Azure',
    yourRating: 5,
    talentComment: 'Excited to work on this project',
    talentRating: 5,
    proximity: '24 Port Harcourt Road, Aba',
    payRange: '₦600k - ₦900k',
    aboutTalent:
      'DevOps engineer with expertise in cloud infrastructure and CI/CD pipelines.',
    video:
      'https://videos.pexels.com/video-files/3184330/3184330-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3184417/pexels-photo-3184417.jpeg',
      'https://images.pexels.com/photos/3184420/pexels-photo-3184420.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'DevOps Engineer',
        skillLevel: 'Advanced',
        amount: 800000,
      },
      {
        jobTitle: 'Cloud Architect',
        skillLevel: 'Intermediate',
        amount: 750000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg',
        name: 'Ngozi Okonkwo',
        comment: 'Efficient and knowledgeable in cloud technologies.',
        date: 'Oct 24, 2025, 4:30 PM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
        name: 'Chukwuma Okafor',
        comment: 'Setup our infrastructure perfectly.',
        date: 'Oct 25, 2025, 11:15 AM',
        yourRating: 5,
      },
    ],
    location: { lat: 5.12, lng: 7.369, city: 'Port Harcourt' },
  },
  {
    id: '18',
    profilePic:
      'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    name: 'Zainab Lawal',
    email: 'zainab.lawal@gmail.com',
    date: 'Sep 20, 2025, 03:45 PM',
    startDate: 'Oct 25, 2025',
    amount: 620000.0,
    offerStatus: 'Awaiting Acceptance',
    status: 'Active',
    jobDescription: 'Mobile app developer for fitness application.',
    yourComment: 'Strong React Native skills',
    yourRating: 0,
    talentComment: 'Considering the offer',
    talentRating: 0,
    proximity: '17 Ibrahim Taiwo Road, Ilorin',
    payRange: '₦550k - ₦750k',
    aboutTalent:
      'Mobile app developer specializing in React Native with fitness app experience.',
    video:
      'https://videos.pexels.com/video-files/3184331/3184331-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3184421/pexels-photo-3184421.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Mobile Developer',
        skillLevel: 'Intermediate',
        amount: 650000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg',
        name: 'Adeola Johnson',
        comment: 'Created a smooth and responsive mobile app.',
        date: 'Oct 26, 2025, 2:20 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 8.5, lng: 4.55, city: 'Ilorin' },
  },
  {
    id: '19',
    profilePic:
      'https://images.pexels.com/photos/1181683/pexels-photo-1181683.jpeg',
    name: 'Tunde Adewale',
    email: 'tunde.adewale@yahoo.com',
    date: 'Sep 21, 2025, 09:30 AM',
    startDate: 'Nov 1, 2025',
    amount: 920000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'Data scientist for analytics platform.',
    yourComment: 'Excellent statistical analysis skills',
    yourRating: 5,
    talentComment: 'Looking forward to the challenge',
    talentRating: 5,
    proximity: '12 Marina Road, Calabar',
    payRange: '₦800k - ₦1.2M',
    aboutTalent:
      'Data scientist with expertise in machine learning and statistical analysis.',
    video:
      'https://videos.pexels.com/video-files/3184332/3184332-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3184422/pexels-photo-3184422.jpeg',
      'https://images.pexels.com/photos/3184423/pexels-photo-3184423.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'Data Scientist',
        skillLevel: 'Advanced',
        amount: 1000000,
      },
      {
        jobTitle: 'Machine Learning Engineer',
        skillLevel: 'Intermediate',
        amount: 900000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
        name: 'Kemi Adetola',
        comment: 'Provided valuable insights from our data.',
        date: 'Oct 27, 2025, 10:45 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        name: 'Femi Bello',
        comment: 'Exceptional analytical skills.',
        date: 'Oct 28, 2025, 3:30 PM',
        yourRating: 5,
      },
    ],
    location: { lat: 4.96, lng: 8.33, city: 'Calabar' },
  },
  {
    id: '20',
    profilePic:
      'https://images.pexels.com/photos/1181243/pexels-photo-1181243.jpeg',
    name: 'Ngozi Chukwu',
    email: 'ngozi.chukwu@gmail.com',
    date: 'Sep 22, 2025, 01:20 PM',
    startDate: 'Nov 5, 2025',
    amount: 580000.0,
    offerStatus: 'Offer Accepted',
    status: 'Active',
    jobDescription: 'QA engineer for mobile applications.',
    yourComment: 'Detail-oriented and thorough tester',
    yourRating: 4,
    talentComment: 'Happy to join the team',
    talentRating: 5,
    proximity: '15 Owerri Road, Umuahia',
    payRange: '₦500k - ₦700k',
    aboutTalent: 'QA engineer specialized in mobile application testing.',
    video:
      'https://videos.pexels.com/video-files/3184333/3184333-hd_1920_1080_30fps.mp4',
    pictures: [
      'https://images.pexels.com/photos/3184424/pexels-photo-3184424.jpeg',
    ],
    skillSet: [
      {
        jobTitle: 'QA Engineer',
        skillLevel: 'Intermediate',
        amount: 600000,
      },
    ],
    recentReview: [
      {
        profilePic:
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
        name: 'Segun Adeyemo',
        comment: 'Found critical bugs that others missed.',
        date: 'Oct 29, 2025, 9:15 AM',
        yourRating: 5,
      },
      {
        profilePic:
          'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
        name: 'Bisi Okon',
        comment: 'Thorough testing methodology.',
        date: 'Oct 30, 2025, 2:40 PM',
        yourRating: 4,
      },
    ],
    location: { lat: 5.533, lng: 7.483, city: 'Umuahia' },
  },
];

export const allSkills = [
  // Web & Software Development
  'Frontend Developer',
  'Backend Developer',
  'Fullstack Developer',
  'Web Developer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'Software Engineer',
  'Embedded Systems Engineer',
  'Game Developer',
  'Desktop Application Developer',

  // UI/UX & Design
  'UI Designer',
  'UX Designer',
  'Product Designer',
  'Graphic Designer',
  'Motion Designer',
  'Visual Designer',
  'Interaction Designer',
  'Illustrator',

  // Data & Analytics
  'Data Scientist',
  'Data Analyst',
  'Business Analyst',
  'Machine Learning Engineer',
  'AI Engineer',
  'Data Engineer',
  'Statistician',
  'Big Data Engineer',
  'Data Visualization Specialist',

  // DevOps & Cloud
  'DevOps Engineer',
  'Cloud Engineer',
  'Site Reliability Engineer (SRE)',
  'System Administrator',
  'Network Engineer',
  'IT Support Specialist',

  // QA & Testing
  'QA Tester',
  'Test Automation Engineer',
  'Manual Tester',
  'Software Tester',

  // Security
  'Cybersecurity Specialist',
  'Ethical Hacker',
  'Security Analyst',
  'Penetration Tester',

  // Project & Product
  'Project Manager',
  'Product Manager',
  'Scrum Master',
  'Agile Coach',

  // Marketing & Business
  'Digital Marketer',
  'SEO Specialist',
  'Content Strategist',
  'Social Media Manager',
  'Business Development Manager',

  // Emerging Tech
  'Blockchain Developer',
  'NFT Developer',
  'AR/VR Developer',
  'IoT Engineer',
  'Robotics Engineer',

  // Others
  'Technical Writer',
  'Database Administrator (DBA)',
  'Customer Success Manager',
  'Support Engineer',
  'AI Prompt Engineer',
];

export const countries: string[] = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'Egypt',
  'Ethiopia',
  'Morocco',
  'Algeria',
  'Uganda',
  'Tanzania',
  'Cameroon',
  'Senegal',
  'Ivory Coast',
  'Rwanda',
  'Zimbabwe',
  'Zambia',
  'Botswana',
  'Namibia',
  'Mali',
  'Niger',
  'Chad',
  'Benin Republic',
];

export const banks: string[] = [
  'Access Bank',
  'GTBank',
  'UBA',
  'First Bank',
  'Zenith Bank',
  'Union Bank',
  'Sterling Bank',
  'Fidelity Bank',
  'Polaris Bank',
  'FCMB',
  'Wema Bank',
  'Keystone Bank',
  'Unity Bank',
  'Opay',
  'PalmPay',
  'Kuda Bank',
  'Moniepoint',
  'VFD Bank',
  'Carbon',
  'Stanbic IBTC',
  'Heritage Bank',
  'Globus Bank',
];

export interface Deposit {
  id: number;
  amount: number;
  walletName: string;
  walletAcctNo: string;
  identifier: string;
  status: 'Successful' | 'Invalid' | 'Reversed' | 'Failed';
  date: Date; // 👈 use Date instead of string
  reason: string;
}

export const deposit: Deposit[] = [
  {
    id: 1,

    amount: 653655,
    walletName: 'Omoseyin Kehinde Jude',
    walletAcctNo: '1234211234',
    identifier: 'Fund Others',
    status: 'Successful',
    date: new Date(2016, 4, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'I want to pay a talent',
  },
  {
    id: 2,
    amount: 450000,
    walletName: 'Adeola Michael',
    walletAcctNo: '9988776655',
    identifier: 'Fund Self',
    status: 'Failed',
    date: new Date(2025, 4, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'Personal',
  },
  {
    id: 3,
    amount: 320500,
    walletName: 'Chukwuemeka Nnamdi',
    walletAcctNo: '5566778899',
    identifier: 'Fund Others',
    status: 'Reversed',
    date: new Date(2025, 4, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'Miscellaneous',
  },
  {
    id: 4,
    amount: 120000,
    walletName: 'Blessing Adeyemi',
    walletAcctNo: '1122334455',
    identifier: 'Fund Self',
    status: 'Invalid',
    date: new Date(2025, 4, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'Personal',
  },
  {
    id: 5,
    amount: 90000,
    walletName: 'Uche Okafor',
    walletAcctNo: '4433221100',
    identifier: 'Fund Others',
    status: 'Successful',
    date: new Date(2024, 4, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'Miscellaneous',
  },
  {
    id: 6,
    amount: 250000,
    walletName: 'Fatima Musa',
    walletAcctNo: '6655443322',
    identifier: 'Fund Self',
    status: 'Failed',
    date: new Date(2021, 4, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'Miscellaneous',
  },
  {
    id: 7,
    amount: 310000,
    walletName: 'Emmanuel Johnson',
    walletAcctNo: '7788990011',
    identifier: 'Fund Others',
    status: 'Successful',
    date: new Date(2020, 5, 4, 10, 57), // May is month 4 (0-indexed)
    reason: 'Personal',
  },
  {
    id: 8,
    amount: 480000,
    walletName: 'Grace Adeola',
    walletAcctNo: '9900112233',
    identifier: 'Fund Self',
    status: 'Reversed',
    date: new Date(2020, 10, 24, 10, 57), // May is month 4 (0-indexed)
    reason: 'Personal',
  },
  {
    id: 9,
    amount: 70000,
    walletName: 'Ibrahim Abdullahi',
    walletAcctNo: '3344556677',
    identifier: 'Fund Others',
    status: 'Invalid',
    date: new Date(2019, 2, 21, 10, 57), // May is month 4 (0-indexed)
    reason: 'Miscellaneous',
  },
  {
    id: 10,
    amount: 150000,
    walletName: 'Chinenye Udo',
    walletAcctNo: '2211334455',
    identifier: 'Fund Self',
    status: 'Successful',
    date: new Date(2021, 9, 6, 10, 57), // May is month 4 (0-indexed)
    reason: 'Miscellaneous',
  },
];

export interface Withdrawal {
  id: number;
  amount: number;
  walletName: string;
  walletAcctNo: string;
  identifier: string;
  status: 'Successful' | 'Pending' | 'Declined' | 'Reversed';
  date: Date;
  bank: string;
  nubamAccNo: string;
  walletId: string;
  acctName?: string; // account holder name (if stored)
  transactionId?: string; // ✅ add this
  // 👇 add these if you plan to use them
  fromName?: string;
  toName?: string;
  fromWalletId?: string;
}

export const withdrawal: Withdrawal[] = [
  {
    id: 1,
    amount: 653655,
    walletName: 'Omoseyin Kehinde Jude',
    walletAcctNo: '1234211234',
    identifier: 'Fund Others',
    status: 'Successful',
    date: new Date(2025, 4, 4, 10, 47), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
  {
    id: 2,
    amount: 450000,
    walletName: 'Adeola Michael',
    walletAcctNo: '9988776655',
    identifier: 'Fund Self',
    status: 'Pending',
    date: new Date(2025, 9, 24, 10, 37), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
  {
    id: 3,
    amount: 320500,
    walletName: 'Chukwuemeka Nnamdi',
    walletAcctNo: '5566778899',
    identifier: 'Fund Others',
    status: 'Declined',
    date: new Date(2020, 4, 10, 1, 7), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
  {
    id: 4,
    amount: 450000,
    walletName: 'Adeola Michael',
    walletAcctNo: '9988776655',
    identifier: 'Fund Self',
    status: 'Reversed',
    date: new Date(2016, 4, 4, 10, 7), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
];

export interface Transfer {
  id: number;
  amount: number;
  walletName: string;
  walletAcctNo: string;
  identifier: string;
  status: 'Successful' | 'Pending' | 'Declined' | 'Reversed';
  bank: string;
  nubamAccNo: string;
  walletId: string;
  date: Date; // 👈 use Date instead of string

  // 👇 add these optional fields to fix your errors
  acctName?: string;
  fromName?: string;
  toName?: string;
  fromWalletId?: string;
}

export const transfer: Transfer[] = [
  {
    id: 1,
    amount: 653655,
    walletName: 'Omoseyin Kehinde Jude',
    walletAcctNo: '1234211234',
    acctName: 'Omosehin Kehinde Jude', // 👈 new
    fromName: 'Shoft Main Wallet', // 👈 new
    toName: 'Omosehin Kehinde Jude', // 👈 new
    identifier: 'Fund Others',
    status: 'Successful',
    date: new Date(2025, 3, 17, 10, 57), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
  {
    id: 2,
    amount: 450000,
    walletName: 'Adeola Michael',
    walletAcctNo: '9988776655',
    acctName: 'Omosehin Kehinde Jude', // 👈 new
    fromName: 'Shoft Main Wallet', // 👈 new
    toName: 'Omosehin Kehinde Jude', // 👈 new
    identifier: 'Fund Self',
    status: 'Pending',
    date: new Date(2025, 4, 4, 10, 7), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
  {
    id: 3,
    amount: 320500,
    walletName: 'Chukwuemeka Nnamdi',
    walletAcctNo: '5566778899',
    acctName: 'Omosehin Kehinde Jude', // 👈 new
    fromName: 'Shoft Main Wallet', // 👈 new
    toName: 'Omosehin Kehinde Jude', // 👈 new
    identifier: 'Fund Others',
    status: 'Declined',
    date: new Date(2025, 4, 24, 10, 8), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
  {
    id: 4,
    amount: 450000,
    walletName: 'Adeola Michael',
    walletAcctNo: '9988776655',
    acctName: 'Omosehin Kehinde Jude', // 👈 new
    fromName: 'Shoft Main Wallet', // 👈 new
    toName: 'Omosehin Kehinde Jude', // 👈 new
    identifier: 'Fund Self',
    status: 'Reversed',
    date: new Date(2021, 9, 24, 9, 57), // May is month 4 (0-indexed)
    bank: 'Access Bank Nigeria Plc',
    nubamAccNo: '1234211234',
    walletId: '0033392845',
  },
];
export const title: string[] = ['Mr', 'Mrs', 'Miss', 'Dr'];
export const gender: string[] = ['Male', 'Female', 'Others'];
export const maritalStatus: string[] = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
];

export const HireCategories = [
  { title: 'Most Hired Talent', key: 'most' },
  { title: 'Least Hired Talent', key: 'least' },
  { title: 'Underperformers', key: 'under' },
  { title: 'Top Performers', key: 'top' },
];

export const HireFilters = [
  { title: 'Offer Accepted', key: 'accepted', status: 'Offer Accepted' },
  {
    title: 'Awaiting Acceptance',
    key: 'awaiting',
    status: 'Awaiting Acceptance',
  },
  { title: 'Offer Rejected', key: 'rejected', status: 'Offer Rejected' },
  { title: '--return all hires--', key: 'all', status: 'all' },
];

export interface Notification {
  id: number;
  sender: string;
  avatar: string;
  handle: string;
  message: string;
  timeLogged: string;
  dateLink: string;
}

export const NotificationsData: Notification[] = [
  {
    id: 1,
    sender: 'Oniduuru Admin Team',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=0D8ABC&color=fff',
    handle: '@Oniduuru_Admin_Team',
    message: 'New Login Alert ✋💻',
    timeLogged: 'Aug 22, 2025, 9:03 AM',
    dateLink: 'Aug 22, 2025, 9:03 AM',
  },
  {
    id: 2,
    sender: 'Oniduuru Admin Team',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=6610F2&color=fff',
    handle: '@Oniduuru_Admin_Team',
    message: 'Password Changed Successfully 🔑',
    timeLogged: 'Aug 21, 2025, 6:20 PM',
    dateLink: 'Aug 21, 2025, 6:20 PM',
  },
  {
    id: 3,
    sender: 'Oniduuru Admin Team',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=28A745&color=fff',
    handle: '@Oniduuru_Admin_Team',
    message: 'New Device Login 📱',
    timeLogged: 'Aug 20, 2025, 11:45 AM',
    dateLink: 'Aug 20, 2025, 11:45 AM',
  },
  {
    id: 4,
    sender: 'Oniduuru Support',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=FFC107&color=fff',
    handle: '@Oniduuru_Support',
    message: 'We’ve received your support request 📨',
    timeLogged: 'Aug 17, 2025, 4:55 PM',
    dateLink: 'Aug 17, 2025, 4:55 PM',
  },
  {
    id: 5,
    sender: 'Oniduuru Billing',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=20C997&color=fff',
    handle: '@Oniduuru_Billing',
    message: 'Your subscription has been renewed 💳',
    timeLogged: 'Aug 15, 2025, 12:10 PM',
    dateLink: 'Aug 15, 2025, 12:10 PM',
  },
  {
    id: 6,
    sender: 'Oniduuru Rewards',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=E83E8C&color=fff',
    handle: '@Oniduuru_Rewards',
    message: 'Congrats! You earned 50 reward points 🎉',
    timeLogged: 'Aug 10, 2025, 5:45 PM',
    dateLink: 'Aug 10, 2025, 5:45 PM',
  },
  {
    id: 7,
    sender: 'Oniduuru Updates',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=17A2B8&color=fff',
    handle: '@Oniduuru_Updates',
    message: 'Check out the new features in v2.0 🚀',
    timeLogged: 'Aug 12, 2025, 10:00 AM',
    dateLink: 'Aug 12, 2025, 10:00 AM',
  },
  {
    id: 8,
    sender: 'Oniduuru Security',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=6F42C1&color=fff',
    handle: '@Oniduuru_Security',
    message: 'Suspicious login attempt blocked 🚫',
    timeLogged: 'Aug 14, 2025, 8:30 AM',
    dateLink: 'Aug 14, 2025, 8:30 AM',
  },
  {
    id: 9,
    sender: 'Oniduuru Admin Team',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=DC3545&color=fff',
    handle: '@Oniduuru_Admin_Team',
    message: 'Profile updated successfully ✏️',
    timeLogged: 'Aug 8, 2025, 2:15 PM',
    dateLink: 'Aug 8, 2025, 2:15 PM',
  },
  {
    id: 10,
    sender: 'Oniduuru Admin Team',
    avatar:
      'https://ui-avatars.com/api/?name=Oniduuru&background=007BFF&color=fff',
    handle: '@Oniduuru_Admin_Team',
    message: 'Two-Factor Authentication Enabled ✅',
    timeLogged: 'Aug 18, 2025, 9:00 AM',
    dateLink: 'Aug 18, 2025, 9:00 AM',
  },
];
export interface Stat {
  key: string;
  label: string;
  value: number;
  delta?: number;
  color?: string;
  suffix?: string;
}
