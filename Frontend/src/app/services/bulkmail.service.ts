import { Designation } from '../common/interfaces/users/designation';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role } from '../common/interfaces/users/role';
import { Event } from '../common/interfaces/event';

@Injectable({
  providedIn: 'root'
})
export class BulkMailService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  sendMailWishes(payload: Event): Observable<any> {
    const formData = new FormData();
    formData.append('to', payload.to);
    formData.append('subject', payload.subject);
    formData.append('message', payload.message);
    if (payload.attachment) {
      formData.append('attachment', payload.attachment, payload.attachment.name);
    }
    return this.http.post<any>(`${this.apiUrl}/birthday/send-wishes`, formData);
  }


  checkMessageStatus(userId: string): Observable<{ isSent: boolean }> {
    return this.http.get<{ isSent: boolean }>(`${this.apiUrl}/birthday/events/check/${userId}`);
  }


  markAsSent(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/birthday/events/mark-sent/${userId}`, {});
  }



  sendEventMail(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-event-mail`, formData);
  }

  EventLogs():Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/email-logs`)

  }

}
