import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getTeam(): Observable<any> {
    return this.http.get(`${this.apiUrl}/team`);
  }

  public addTeam(data: any): Observable<any> {
    return this.http.post( 'http://localhost:8000/team', data);
  }
}
