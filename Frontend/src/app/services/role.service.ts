import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from '../common/interfaces/role'; 
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {


  private apiUrl = 'http://localhost:8000'; 
 
  constructor(private http: HttpClient) { }

  getRole(): Observable<any> {
    return this.http.get(`${this.apiUrl}/role`);
  }
  
  public addRole(data: any): Observable<any> {
    return this.http.post( 'http://localhost:8000/role', data);
  }
}
