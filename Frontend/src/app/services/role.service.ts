import { Designation } from '../common/interfaces/users/designation';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role } from '../common/interfaces/users/role';

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
    return this.http.get<Role>(this.apiUrl + '/role/findbyid/'+id);
  }

  deleteRole(id: number) {
    return this.http.delete(this.apiUrl + "/role/" + id);
  }

  getDesignation(filterValue?: string, page?: number, pagesize?:number): Observable<Designation[]> {
    return this.http.get<Designation[]>(this.apiUrl + `/designation/find/?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  addDesignation(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/designation/add", data);
  }

  updateDesignation(id: number, data: any): Observable<any> {
    return this.http.patch(this.apiUrl+`/designation/update/${id}`, data);
  }

  getDesignationbyRole(id: number): Observable<any> {
    return this.http.get(this.apiUrl+`/designation/byroleid/${id}`);
  }

  deleteDesignation(id: number) {
    return this.http.delete(this.apiUrl + "/designation/delete/" + id);
  }
}
