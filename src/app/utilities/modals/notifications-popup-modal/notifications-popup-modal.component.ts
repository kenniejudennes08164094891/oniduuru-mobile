// notifications-popup-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

interface Notification {
  id: number;
  sender: string;
  avatar: string;
  handle: string;
  message: string;
  timeLogged: string;
  dateLink: string;
}

@Component({
  selector: 'app-notifications-popup-modal',
  templateUrl: './notifications-popup-modal.component.html',
  styleUrls: ['./notifications-popup-modal.component.scss'],
})
export class NotificationsPopupModalComponent implements OnInit {
  images = imageIcons;

  notifications: Notification[] = [];

  ngOnInit() {
    this.notifications = [
      {
        id: 1,
        sender: 'Oniduuru Admin Team',
        avatar: this.images.ProfileIcon,
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
        avatar: this.images.ProfileIcon,
        handle: '@Oniduuru_Admin_Team',
        message: 'New Device Login 📱',
        timeLogged: 'Aug 20, 2025, 11:45 AM',
        dateLink: 'Aug 20, 2025, 11:45 AM',
      },
      {
        id: 4,
        sender: 'Oniduuru Admin Team',
        avatar:
          'https://ui-avatars.com/api/?name=Oniduuru&background=6F42C1&color=fff',
        handle: '@Oniduuru_Admin_Team',
        message: 'Two-Factor Authentication Enabled ✅',
        timeLogged: 'Aug 18, 2025, 9:00 AM',
        dateLink: 'Aug 18, 2025, 9:00 AM',
      },
      {
        id: 5,
        sender: 'Oniduuru Support',
        avatar: this.images.ProfileIcon,
        handle: '@Oniduuru_Support',
        message: 'We’ve received your support request 📨',
        timeLogged: 'Aug 17, 2025, 4:55 PM',
        dateLink: 'Aug 17, 2025, 4:55 PM',
      },
      {
        id: 6,
        sender: 'Oniduuru Billing',
        avatar: this.images.scouterImage,
        handle: '@Oniduuru_Billing',
        message: 'Your subscription has been renewed 💳',
        timeLogged: 'Aug 15, 2025, 12:10 PM',
        dateLink: 'Aug 15, 2025, 12:10 PM',
      },
      {
        id: 7,
        sender: 'Oniduuru Security',
        avatar: this.images.scouterImage,
        handle: '@Oniduuru_Security',
        message: 'Suspicious login attempt blocked 🚫',
        timeLogged: 'Aug 14, 2025, 8:30 AM',
        dateLink: 'Aug 14, 2025, 8:30 AM',
      },
      {
        id: 8,
        sender: 'Oniduuru Updates',
        avatar: this.images.scouterImage,
        handle: '@Oniduuru_Updates',
        message: 'Check out the new features in v2.0 🚀',
        timeLogged: 'Aug 12, 2025, 10:00 AM',
        dateLink: 'Aug 12, 2025, 10:00 AM',
      },
      {
        id: 9,
        sender: 'Oniduuru Rewards',
        avatar: this.images.ProfileIcon,
        handle: '@Oniduuru_Rewards',
        message: 'Congrats! You earned 50 reward points 🎉',
        timeLogged: 'Aug 10, 2025, 5:45 PM',
        dateLink: 'Aug 10, 2025, 5:45 PM',
      },
      {
        id: 10,
        sender: 'Oniduuru Admin Team',
        avatar:
          'https://ui-avatars.com/api/?name=Oniduuru&background=6610F2&color=fff',
        handle: '@Oniduuru_Admin_Team',
        message: 'Profile updated successfully ✏️',
        timeLogged: 'Aug 8, 2025, 2:15 PM',
        dateLink: 'Aug 8, 2025, 2:15 PM',
      },
    ];
  }
}
