import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Role } from '../common/interfaces/role';
import { User } from '../common/interfaces/user';


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

  uploadImage(file: any): Observable<any> {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append("file", file, file.name);
      return this.http.post(this.apiUrl + '/user/fileupload', formData);
    } else {
      // Handle the case where 'file' is not a File object
      return throwError("Invalid file type");
    }
  }

  // deleteInvoice(id: number, fileName: string){
  //   return this._http.delete(this.url + `/invoice/filedelete/?id=${id}&fileName=${fileName}`);
  // }
  updateUser(id: number, data: any){
      return this.http.patch(this.apiUrl + '/user/update/' + id, data);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}/user/delete/${id}`);
  }

  getUserByRoleId(id:number):Observable<User>{
    return this.http.get<User>('http://localhost:8000/user/findbyrole/'+id)

  }

  getUserById(id:number):Observable<User>{
    return this.http.get<User>('http://localhost:8000/auth/findbyuser/'+id)

  }
}
