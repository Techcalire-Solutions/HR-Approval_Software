import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LeaveType } from '../common/interfaces/leaveType';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';
import { UserLeave } from '../common/interfaces/userLeave';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {

  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  addLeave(data:any){
    return this.http.post(this.apiUrl+'/leave', data)
  }
   getLeaves():Observable<any>{
    return this.http.get(`${this.apiUrl}/leave`);
   }

   getLeaveByUser(id: number) {
    return this.http.get(`${this.apiUrl}/leave/${id}`);
  }



  addLeaveType(data:any){
    return this.http.post(this.apiUrl+'/leaveType/', data)
  }
  getLeaveType(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaveType`);
  }
  updateLeaveType(id: number, data: any): Observable<LeaveType> {
    return this.http.patch<LeaveType>(this.apiUrl + "/leaveType/" + id, data);
  }

  deleteLeaveType(id: number) {
    return this.http.delete(this.apiUrl + "/leaveType/" + id);
  }

  getUserLeave(userId: number, typeid: number): Observable<UserLeave> {
    return this.http.get<UserLeave>(`${this.apiUrl}/userLeave/byuserandtype/${userId}/${typeid}`);
  }
}
