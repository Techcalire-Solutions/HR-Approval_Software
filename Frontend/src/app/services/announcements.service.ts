import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  addAnnouncement(data: any){
    return this.http.post(this.apiUrl + '/announcements/add', data)
  }

  getAnnouncement(){
    return this.http.get(this.apiUrl + '/announcements/find')
  }
}
