import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../common/models/user.model';

@Injectable()
export class UsersService {
  private apiUrl = 'http://localhost:8000';

  constructor(public http: HttpClient) { }

  getUser(search?:string, page?: number, pageSize?: number): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + `/user/find/?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  addUser(user:User){
      return this.http.post(this.apiUrl, user);
  }

  updateUser(user:User){
      return this.http.put(this.apiUrl, user);
  }

  deleteUser(id: number) {
      return this.http.delete(this.apiUrl + "/" + id);
  }
}
