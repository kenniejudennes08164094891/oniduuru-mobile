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

// src/app/models/mock-hires.ts
export interface MockPayment {
  id: string;
  profilePic: string;
  name: string;
  email: string;
  date: string;
  startDate: string;
  amount: number;
  status: 'Offer Accepted' | 'Awaiting Acceptance' | 'Offer Rejected';

  jobDescription?: string;
  yourComment?: string;
  yourRating?: number;
  talentComment?: string;
  talentRating?: number;
}

export const MockRecentHires: MockPayment[] = [
  {
    id: '1',
    profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'John Doe',
    email: 'JohnDoe@gmail.com',
    date: 'Sep 10, 2025, 11:45 AM',
    startDate: 'Jan 1, 2025',
    amount: 700000.0,
    status: 'Offer Accepted',
    jobDescription: 'I need a software dev for my startup.',
    yourComment: 'Jude did a great work',
    yourRating: 5,
    talentComment: 'N/A',
    talentRating: 0,
  },
  {
    id: '2',
    profilePic: 'https://randomuser.me/api/portraits/women/45.jpg',
    name: 'Jane Smith',
    email: 'Janesmt@gmail.com',
    date: 'Sep 9, 2025, 03:15 PM',
    startDate: 'Jan 9, 2025',
    amount: 500000.0,
    status: 'Awaiting Acceptance',
    jobDescription: 'Frontend designer role for ecommerce app.',
    yourComment: 'Still waiting for confirmation',
    yourRating: 0,
    talentComment: 'Looking forward to working!',
    talentRating: 4,
  },
  {
    id: '3',
    profilePic: 'https://randomuser.me/api/portraits/men/21.jpg',
    name: 'Michael Johnson',
    email: 'MichaelJohnson@gmail.com',
    date: 'Sep 8, 2025, 09:30 AM',
    startDate: 'Feb 1, 2025',
    amount: 23475.0,
    status: 'Offer Rejected',
    jobDescription: 'Backend developer needed for finance app.',
    yourComment: 'Did not meet project requirements',
    yourRating: 2,
    talentComment: 'Thanks for the opportunity',
    talentRating: 3,
  },
  {
    id: '4',
    profilePic: 'https://randomuser.me/api/portraits/women/18.jpg',
    name: 'Emily Davis',
    email: 'Emily@gmail.com',
    date: 'Sep 7, 2025, 07:50 PM',
    startDate: 'Dec 1, 2025',
    amount: 234599.99,
    status: 'Offer Accepted',
    jobDescription: 'Mobile app designer for fintech project.',
    yourComment: 'Great collaboration so far',
    yourRating: 4,
    talentComment: 'Excited to join!',
    talentRating: 5,
  },
  {
    id: '5',
    profilePic: 'https://randomuser.me/api/portraits/men/67.jpg',
    name: 'Robert Wilson',
    email: 'RobertW@protonmail.com',
    date: 'Sep 6, 2025, 02:20 PM',
    startDate: 'Mar 15, 2025',
    amount: 320000.0,
    status: 'Offer Accepted',
    jobDescription: 'Full-stack developer for SaaS platform.',
    yourComment: 'Excellent technical skills',
    yourRating: 5,
    talentComment: 'Great team and project',
    talentRating: 5,
  },
  {
    id: '6',
    profilePic: 'https://randomuser.me/api/portraits/women/32.jpg',
    name: 'Sarah Thompson',
    email: 'Sarah.T@outlook.com',
    date: 'Sep 5, 2025, 10:10 AM',
    startDate: 'Apr 1, 2025',
    amount: 275000.0,
    status: 'Awaiting Acceptance',
    jobDescription: 'UX/UI designer for healthcare app.',
    yourComment: 'Impressive portfolio',
    yourRating: 0,
    talentComment: 'Considering other offers',
    talentRating: 4,
  },
  {
    id: '7',
    profilePic: 'https://randomuser.me/api/portraits/men/89.jpg',
    name: 'David Chen',
    email: 'David.Chen@yahoo.com',
    date: 'Sep 4, 2025, 04:45 PM',
    startDate: 'May 10, 2025',
    amount: 450000.0,
    status: 'Offer Rejected',
    jobDescription: 'Data scientist for analytics team.',
    yourComment: 'Salary expectations too high',
    yourRating: 3,
    talentComment: 'Accepted better offer elsewhere',
    talentRating: 4,
  },
  {
    id: '8',
    profilePic: 'https://randomuser.me/api/portraits/women/56.jpg',
    name: 'Lisa Rodriguez',
    email: 'Lisa.R@company.com',
    date: 'Sep 3, 2025, 09:15 AM',
    startDate: 'Jun 5, 2025',
    amount: 189999.5,
    status: 'Offer Accepted',
    jobDescription: 'Content writer for tech blog.',
    yourComment: 'Strong writing samples',
    yourRating: 4,
    talentComment: 'Excited about the topic',
    talentRating: 5,
  },
  {
    id: '9',
    profilePic: 'https://randomuser.me/api/portraits/men/44.jpg',
    name: 'James Anderson',
    email: 'J.Anderson@mail.com',
    date: 'Sep 2, 2025, 01:30 PM',
    startDate: 'Jul 20, 2025',
    amount: 625000.0,
    status: 'Awaiting Acceptance',
    jobDescription: 'CTO for early-stage startup.',
    yourComment: 'Perfect candidate if accepted',
    yourRating: 0,
    talentComment: 'Reviewing contract details',
    talentRating: 5,
  },
  {
    id: '10',
    profilePic: 'https://randomuser.me/api/portraits/women/71.jpg',
    name: 'Maria Garcia',
    email: 'Maria.G@business.com',
    date: 'Sep 1, 2025, 06:40 PM',
    startDate: 'Aug 1, 2025',
    amount: 155000.0,
    status: 'Offer Accepted',
    jobDescription: 'Social media manager for brand.',
    yourComment: 'Creative campaign ideas',
    yourRating: 4,
    talentComment: 'Ready to start immediately',
    talentRating: 5,
  },
  {
    id: '11',
    profilePic: 'https://randomuser.me/api/portraits/men/23.jpg',
    name: 'Thomas Miller',
    email: 'Tom.Miller@tech.io',
    date: 'Aug 31, 2025, 11:20 AM',
    startDate: 'Sep 15, 2025',
    amount: 289000.0,
    status: 'Offer Rejected',
    jobDescription: 'DevOps engineer for cloud infrastructure.',
    yourComment: 'Found another candidate',
    yourRating: 2,
    talentComment: 'Position not the right fit',
    talentRating: 3,
  },
  {
    id: '12',
    profilePic: 'https://randomuser.me/api/portraits/women/88.jpg',
    name: 'Jennifer White',
    email: 'Jen.White@design.com',
    date: 'Aug 30, 2025, 03:55 PM',
    startDate: 'Oct 1, 2025',
    amount: 420000.0,
    status: 'Offer Accepted',
    jobDescription: 'Product manager for mobile app.',
    yourComment: 'Strong leadership qualities',
    yourRating: 5,
    talentComment: 'Looking forward to the challenge',
    talentRating: 5,
  }
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