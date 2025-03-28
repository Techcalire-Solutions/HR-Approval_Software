import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, catchError, mapTo, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../common/interfaces/users/user';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private _http:HttpClient) { }

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private readonly REFRESH_TOKEN = 'REFRESH_TOKEN';
  private loggedUser: any;
  // private loggedInUsername: any;

  private  currentUserSource = new ReplaySubject<any>(1)
  currentUser$ = this.currentUserSource.asObservable();

  url = environment.apiUrl

  private doLoginUser(userName: String, tokens: any){
    this.loggedUser = userName
    this.storeTokens(tokens)
  }

  loginUser(data: any) {
   return this._http.post(this.url + '/auth', data).pipe(
     tap((tokens) => this.doLoginUser(data.email, tokens)),
     mapTo(true), catchError((error: any) => {
        return of(false)
     })
   )
  }
  private storeTokens(tokens: any){
    localStorage.setItem(this.JWT_TOKEN, tokens.token.accessToken)
    localStorage.setItem(this.REFRESH_TOKEN, tokens.token.refreshToken)
    localStorage.setItem('token', JSON.stringify(tokens))
  }
  getUserByRole(id: number):Observable<User[]>{
    return this._http.get<User[]>(this.url + '/user/findbyrole/'+id)
  }
  getUserByRoleName(roleName: string): Observable<User[]> {
    return this._http.get<User[]>(`${this.url}/user/findbyroleName/${roleName}`);
  }

  getJWTToken() {
    return localStorage.getItem(this.JWT_TOKEN);

  }

  isLoggedIn(): boolean {
    return !!this.getJWTToken();

  }




   logoutUser(){
    localStorage.removeItem(this.JWT_TOKEN)
    localStorage.removeItem(this.REFRESH_TOKEN)
    localStorage.removeItem('token')
   }

   addAttendance(data: any){
    return this._http.post(this.url + '/attendance', data)
  }

  // getAttendance():Observable<Attendance[]>{
  //   return this._http.get<Attendance[]>(this.url + '/attendance')
  // }

  // updateAttendanceByUser(id: number, data: any):Observable<Attendance>{
  //   return this._http.patch<Attendance>(this.url + '/attendance/' + id, data)
  // }

  //  NEW


  //---------------------------User-------------------------------------
  registerUser(data : any){
    return this._http.post(this.url + '/user/add', data)
  }

  getUserById(id: number): Observable<User>{
    return this._http.get<User>(this.url + '/user/findone/'+id);
  }
}
