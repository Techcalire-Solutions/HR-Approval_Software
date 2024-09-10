import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Team } from '../common/interfaces/team';

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
  updateTeam(id: number, data: any): Observable<Team> {
    return this.http.patch<Team>(`${this.apiUrl}/team/` + id, data);
  }
  deleteTeam(id: number) {
    return this.http.delete(`${this.apiUrl}/team/` +id);
  }
}
