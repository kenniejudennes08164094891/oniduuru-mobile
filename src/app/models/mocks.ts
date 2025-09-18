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
  lat: number;
  lng: number;
  city: string;
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
  // skillLevel: string;
  payRange: string;
  aboutTalent: string;
  // jobTitles: string[]; // multiple job titles
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
        amount: 500000,
      },
      {
        jobTitle: 'Backend Developer',
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
    location: { lat: 6.4654, lng: 3.4064, city: 'Victoria Island' }, // Victoria Island
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
    location: { lat: 6.4431, lng: 3.3919, city: 'Lekki' }, // Lekki
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
    location: { lat: 6.4969, lng: 3.3673, city: 'Surulere' }, // Surulere
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
    location: { lat: 6.455, lng: 3.3972, city: 'Ikoyi' }, // Ikoyi
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
    location: { lat: 6.517, lng: 3.394, city: 'Ajah' }, // Ajah
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
    location: { lat: 6.5241, lng: 3.3793, city: 'Marina' }, // Marina
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
    location: { lat: 6.5431, lng: 3.3512, city: 'Apapa' }, // Apapa
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
    location: { lat: 6.535, lng: 3.3742, city: 'Yaba' }, // Yaba
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
