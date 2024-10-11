import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LeaveType } from '../common/interfaces/leaveType';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';
import { UserLeave } from '../common/interfaces/userLeave';
import {  throwError } from 'rxjs';
import { Holidays } from '../common/interfaces/holidays';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {

  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  addLeave(data:any){
    return this.http.post(this.apiUrl+'/leave', data)
  }
  addEmergencyLeave(data:any){
    return this.http.post(this.apiUrl+'/leave/emergencyLeave', data)
  }

  updatemergencyLeave(data:any, id: number){
    return this.http.patch(this.apiUrl +'/leave/updateemergencyLeave/'+ id, data)
  }

  getLeaves():Observable<any>{
    return this.http.get(`${this.apiUrl}/leave`);
   }

  deleteLeave(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leave/${id}`);
  }

  updateLeave(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/leave/${id}`, data);
  }

  getLeaveById(id: number) {
    return this.http.get(`${this.apiUrl}/leave/${id}`);
  }

  getLeaveCounts(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/userLeave/leavecount/${userId}`);
  }

   getLeavesByUser(userId: number, search?: string, page?: number, pageSize?: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leave/user/${userId}?search=${search}&page=${page}&pageSize=${pageSize}`);
  }
  updateApproveLeaveStatus(leaveId: any) {
    return this.http.put(`${this.apiUrl}/leave/approveLeave/${leaveId}`, {});
  }

  updateRejectLeaveStatus(leaveId: any) {
    return this.http.put(`${this.apiUrl}/leave/rejectLeave/${leaveId}`, {});
  }
  uploadImage(file: any): Observable<any> {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append("file", file, file.name);
      return this.http.post(`${this.apiUrl}/leave/fileupload`, formData);
    }
    return throwError(() => new Error("Invalid file type"));
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

  updateUserLeave(data: any): Observable<UserLeave> {
    return this.http.patch<UserLeave>(`${this.apiUrl}/userLeave/update`, data);
  }

  getUserLeaveByUser(id: number){
    return this.http.get<UserLeave[]>(`${this.apiUrl}/userLeave/byuser/${id}`);
  }

  getHolidays(filterValue?: string, page?: number, pagesize?:number){
    return this.http.get<Holidays[]>(`${this.apiUrl}/holidays/find?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  updateCompoOff(id: number, data: any){
    return this.http.patch<Holidays[]>(`${this.apiUrl}/holidays/update/`+id, data);
  }
}
