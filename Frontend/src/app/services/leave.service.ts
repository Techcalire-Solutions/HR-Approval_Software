import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LeaveType } from '../common/interfaces/leaveType';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {

  private apiUrl = 'http://localhost:8000';
  constructor(private http: HttpClient) { }

  addLeave(data:any){
    return this.http.post(this.apiUrl+'/leave/', data)
  }
  addLeaveType(data:any){
    return this.http.post(this.apiUrl+'/leaveType/', data)
  }
  updateLeaveType(id: number, data: any): Observable<LeaveType> {
    return this.http.patch<LeaveType>(this.apiUrl + "/leaveType/" + id, data);
  }

  deleteLeaveType(id: number) {
    return this.http.delete(this.apiUrl + "/leaveType/" + id);
  }
}
