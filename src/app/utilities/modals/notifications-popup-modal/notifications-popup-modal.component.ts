// notifications-popup-modal.component.ts
import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { NotificationsData, Notification } from 'src/app/models/mocks';

@Component({
  selector: 'app-notifications-popup-modal',
  templateUrl: './notifications-popup-modal.component.html',
  styleUrls: ['./notifications-popup-modal.component.scss'],
  standalone: false,
})
export class NotificationsPopupModalComponent implements OnInit {
  images = imageIcons;

  notifications: Notification[] = [];

  ngOnInit() {
    this.notifications = NotificationsData;
  }
}
