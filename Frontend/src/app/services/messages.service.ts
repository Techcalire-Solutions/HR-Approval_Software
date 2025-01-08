import {inject, Injectable} from '@angular/core'
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessagesService {
  private apiUrl = `${environment.apiUrl}/notification`; // Update to include the notifications endpoint
  http = inject(HttpClient);


  createNotification(userId: string, message: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, { userId, message });
  }

  getUserNotifications(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }
  private notificationsSubject = new Subject<any[]>(); // Subject to emit notifications
  public notifications$ = this.notificationsSubject.asObservable();


 // Mark notification as read
 markAsRead(notificationId: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/mark-read/${notificationId}`, {});
}

// Get unread notifications count
getUnreadCount(): Observable<any> {
  return this.http.get(`${this.apiUrl}/unread-count`);
}



  getAllNotifications(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-read/${notificationId}`, {});
  }

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${notificationId}`);
  }







}
