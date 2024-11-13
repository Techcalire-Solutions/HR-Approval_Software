import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Team } from '../common/interfaces/users/team';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getTeam(): Observable<any> {
    return this.http.get(`${this.apiUrl}/team`);
  }

  public addTeam(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/team', data);
  }
  updateTeam(id: number, data: any): Observable<Team> {
    return this.http.patch<Team>(`${this.apiUrl}/team/` + id, data);
  }
  deleteTeam(id: number) {
    return this.http.delete(`${this.apiUrl}/team/` +id);
  }
}
