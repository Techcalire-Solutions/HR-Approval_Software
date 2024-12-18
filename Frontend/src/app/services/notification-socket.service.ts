import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class NotificationSocketService {
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  private socket$: WebSocketSubject<any>;
  notifications: any[] = [];
  constructor() {
    this.socket$ = new WebSocketSubject('ws://localhost:8000');

  }
   // Emit notifications to subscribers
   sendNotifications(newNotifications: any[]) {
    this.notificationsSubject.next(newNotifications);
  }

  // Return observable to subscribe in components
  getNotifications() {
    return this.notificationsSubject.asObservable();
  }

  connect(): void {
    this.socket$.subscribe(
      (message) => {
        console.log('Received message from server: ', message);
      },
      (err) => {
        console.error('Error: ', err);
      },
      () => {
        console.log('Connection closed');
      }
    );
  }

  sendMessage(message: any): void {
    this.socket$.next(message);
  }

  closeConnection(): void {
    this.socket$.complete();
  }
  getCurrentNotifications() {
    return this.notificationsSubject.getValue();
  }
}
