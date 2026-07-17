import {inject, Injectable} from '@angular/core'
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  // getUserNotifications(userId: number): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  // }
  getUserNotifications(userId: number, page: number, limit: number): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/user/${userId}`, { params });
  }
  private notificationsSubject = new Subject<any[]>(); // Subject to emit notifications
  public notifications$ = this.notificationsSubject.asObservable();


  // Mark notification as read
  markAsReadold(notificationId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/mark-read/${notificationId}`, {});
  }

  // Get unread notifications count
  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/unread-count`);
  }



  // getAllNotifications(): Observable<any> {
  //   return this.http.get<any>(this.apiUrl);
  // }

getAllNotifications(page: number, limit: number): Observable<any> {
  const params = new HttpParams()
    .set('page', page.toString())
    .set('limit', limit.toString());

  // Passes page and limit directly to your root URL (e.g. https://api.../notification?page=1&limit=15)
  return this.http.get<any>(this.apiUrl, { params });
}

  markNotificationAsRead(notificationId: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/mark-read/${notificationId}`, {});
  }


  // messages.service.ts (Add the isAdmin flag to the method)
markAsRead(notificationId: string, isAdmin: boolean = false) {
  const endpoint = isAdmin 
    ? `/api/notifications/admin/mark-read/${notificationId}` 
    : `/api/notifications/mark-read/${notificationId}`;
    
  return this.http.put<any>(endpoint, {});
}

  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete/${notificationId}`);
  }







}
