/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LeaveType } from '../common/interfaces/leaves/leaveType';
import { Observable } from 'rxjs/internal/Observable';
import { environment } from '../../environments/environment';
import { UserLeave } from '../common/interfaces/leaves/userLeave';
import {  throwError } from 'rxjs';
import { Holidays } from '../common/interfaces/leaves/holidays';
import { CompoOff } from '../common/interfaces/leaves/compo-off';
import { Leave } from '../common/interfaces/leaves/leave';

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
    return this.http.get(`${this.apiUrl}/leave/all/totalleaves`);
   }

   getReport(year: number):Observable<any>{
    return this.http.get(`${this.apiUrl}/leave/all/report?year=${year}`);
   }

  deleteLeave(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leave/${id}`);
  }

  updateLeave(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/leave/${id}`, data);
  }

  getLeaveById(id: number) {
    return this.http.get<Leave>(`${this.apiUrl}/leave/${id}`);
  }

  getLeaveCounts(userId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/userLeave/leavecount/${userId}`);
  }

   getLeavesByUser(userId: number, search?: string, page?: number, pageSize?: number): Observable<any[]> {
    console.log(userId);
    
    return this.http.get<any[]>(`${this.apiUrl}/leave/user/${userId}?search=${search}&page=${page}&pageSize=${pageSize}`);
  }


  getLeavesPaginated(search?: string, page?: number, pageSize?: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leave/?search=${search}&page=${page}&pageSize=${pageSize}`);
}


updateApproveLeaveStatus(approvalData: any) {
  const { leaveId, adminNotes } = approvalData;
  return this.http.put(`${this.apiUrl}/leave/approveLeave/${leaveId}`, { adminNotes });
}

getLeaveBalance(leaveId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/leave/leaveBalance/${leaveId}`);
}



updateRejectLeaveStatus(rejectionData: any) {
  const { leaveId, adminNotes } = rejectionData;
  return this.http.put(`${this.apiUrl}/leave/rejectLeave/${leaveId}`, { adminNotes });
}

  uploadImage(file: any): Observable<any> {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append("file", file, file.name);
      return this.http.post(`${this.apiUrl}/leave/fileupload`, formData);
    }
    return throwError(() => new Error("Invalid file type"));
  }

  deleteUploaded(id: number, key?: string) {
    return this.http.delete(`${this.apiUrl}/leave/filedelete?id=${id}&key=${key}`);
  }

  deleteUploadByurl(key: string) {
    return this.http.delete(`${this.apiUrl}/leave/filedeletebyurl/?key=${key}`);
  }

  addLeaveType(data:any){
    return this.http.post(this.apiUrl+'/leaveType/', data)
  }

  // getLeaveType(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/leaveType`);
  // }
  getLeaveType(filterValue?: string, page?: number, pagesize?:number): Observable<LeaveType[]> {
    return this.http.get<LeaveType[]>(this.apiUrl + `/leaveType/find/?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
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

  getUserLeaveForEncash(){
    return this.http.get<any[]>(`${this.apiUrl}/userLeave/forencashment/`);
  }

addHolidays(data:any){
  return this.http.post(this.apiUrl+'/holidays/save', data)

}

  getHolidays(filterValue?: string, page?: number, pagesize?:number){
    return this.http.get<Holidays[]>(`${this.apiUrl}/holidays/find?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  updateCompoOff(id: number, data: any){
    return this.http.patch<Holidays[]>(`${this.apiUrl}/holidays/update/`+id, data);
  }

  updateUpdatedCompoOff(id: number, data: any){
    return this.http.patch<Holidays[]>(`${this.apiUrl}/holidays/updatetheupdated/`+id, data);
  }

  getCompoOff(id: number){
    return this.http.get<CompoOff>(`${this.apiUrl}/holidays/findcombooff/${id}`);
  }



  deleteUntakenLeave(leaveId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leave/untakenLeaveDelete/${leaveId}`);
  }

  untakenLeaveUpdate(leaveId: number, updatedData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/leave/untakenLeaveUpdate/${leaveId}`, updatedData);
  }

updateLeaveFileUrl(leaveId: string, fileUrl: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/leave/updateLeaveFileUrl/${leaveId}`, { fileUrl });
  }


encashLeave(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/encash`, data);
  }
}
