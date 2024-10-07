import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Role } from '../common/interfaces/role';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getRole(filterValue?: string, page?: number, pagesize?:number): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl + `/role/find/?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  public addRole(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/role", data);
  }

  updateRole(id: number, data: any): Observable<Role> {
    return this.http.patch<Role>(this.apiUrl + "/role/" + id, data);
  }

  public getRoleById(id: number): Observable<Role>{
    return this.http.get<Role>(this.apiUrl + '/role/'+id);
  }

  deleteRole(id: number) {
    return this.http.delete(this.apiUrl + "/role/" + id);
  }

}
