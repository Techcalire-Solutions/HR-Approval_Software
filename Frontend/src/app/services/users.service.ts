import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../common/models/user.model';
import { Role } from '../common/interfaces/role';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = 'http://localhost:8000';

  constructor(public http: HttpClient) { }

  getUser(search?:string, page?: number, pageSize?: number): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + `/user/find/?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  // addUser(user:User){
  //     return this.http.post(this.apiUrl, user);
  // }
  public addUser(data: any): Observable<any> {
    return this.http.post( 'http://localhost:8000/user/add', data);
  }

  updateUser(user:User){
      return this.http.put(this.apiUrl, user);
  }

  deleteUser(id: number) {
      return this.http.delete(this.apiUrl + "/" + id);
  }

  getUserByRoleId(id:number):Observable<User>{
    return this.http.get<User>('http://localhost:8000/user/findbyrole/'+id)

  }
  // getRoleById(id: number): Observable<Role> {
  //   return this._http.get<Role>(this.url + "/role/" + id);
  // }

  getUserById(id:number):Observable<User>{
    return this.http.get<User>('http://localhost:8000/auth/findbyuser/'+id)

  }
}
