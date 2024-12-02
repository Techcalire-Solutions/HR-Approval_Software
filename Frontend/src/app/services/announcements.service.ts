/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Announcement } from '../common/interfaces/announcement';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private callSubmitSource = new Subject<any>();

  callSubmit$ = this.callSubmitSource.asObservable();

  triggerSubmit(data: any) {
    this.callSubmitSource.next(data);
  }

  addAnnouncement(data: any){
    return this.http.post(this.apiUrl + '/announcements/add', data)
  }

  getAnnouncement(): Observable<Announcement[]>{
    return this.http.get<Announcement[]>(this.apiUrl + '/announcements/find')
  }
  
  deleteAnnouncement(id: number){
    return this.http.delete(this.apiUrl + '/announcements/delete/' + id)
  }

  uploadAnnouncementDoc(formData: any): Observable<any> {
    return this.http.post(this.apiUrl + '/announcements/fileupload', formData);
  }

  deleteAnouncemntUpload(id: number, key?: string) {
    return this.http.delete(`${this.apiUrl}/announcements/filedelete?id=${id}&key=${key}`);
  }

  deleteAnouncemntUploadByurl(key: string) {
    return this.http.delete(`${this.apiUrl}/announcements/filedeletebyurl/?key=${key}`);
  }
}
