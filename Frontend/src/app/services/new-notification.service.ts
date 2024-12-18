import { Injectable } from '@angular/core';
import { NotificationSocketService } from './notification-socket.service';

@Injectable({
  providedIn: 'root'
})
export class NewNotificationService {

  constructor(private notificationSocketService: NotificationSocketService) {}
  receiveNewNotification(notification: any) {
    // Fetch the current notifications using the new method
    const currentNotifications = this.notificationSocketService.getCurrentNotifications();

    // Add the new notification to the array
    currentNotifications.push(notification);

    // Emit the updated notifications list
    this.notificationSocketService.sendNotifications(currentNotifications);
  }
}
