import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Leave } from '../common/interfaces/leaves/leave';
import { UserLeave } from '../common/interfaces/leaves/userLeave';
import { LeaveType } from '../common/interfaces/leaves/leaveType';

@Injectable({
  providedIn: 'root'
})
export class NewLeaveService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getLeavesPaginated(value: string, search?: string, page?: number, pageSize?: number): Observable<any[]> {
    if(value === 'Not') return this.http.get<any[]>(`${this.apiUrl}/newleave/find/?search=${search}&page=${page}&pageSize=${pageSize}`);
    else return this.http.get<any[]>(`${this.apiUrl}/newleave/findlocked/?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  getRequestedLeaves( page?: number, pageSize?: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/newleave/find/requested/?page=${page}&pageSize=${pageSize}`);
  }

  getLeaves():Observable<any>{
    return this.http.get(`${this.apiUrl}/newleave/all/totalleaves`);
  }

  getLeavesByUser(value: string, userId: number, search?: string, page?: number, pageSize?: number): Observable<any[]> {
    if(value === 'Not') return this.http.get<any[]>(`${this.apiUrl}/newleave/user/${userId}?search=${search}&page=${page}&pageSize=${pageSize}`);
    return this.http.get<any[]>(`${this.apiUrl}/newleave/userlocked/${userId}?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  getLeaveBalance(leaveId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/newleave/leaveBalance/${leaveId}`);
  }

  updateApproveLeaveStatus(approvalData: any) {
    const { leaveId, adminNotes } = approvalData;
    return this.http.put(`${this.apiUrl}/newleave/approveLeave/${leaveId}`, { adminNotes });
  }

  updateRejectLeaveStatus(rejectionData: any) {
    const { leaveId, adminNotes } = rejectionData;
    return this.http.put(`${this.apiUrl}/newleave/rejectLeave/${leaveId}`, { adminNotes });
  }

  updateLeaveFileUrl(leaveId: number, fileUrl: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/newleave/updateLeaveFileUrl/${leaveId}`, { fileUrl });
  }

  deleteUntakenLeave(leaveId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/newleave/untakenLeaveDelete/${leaveId}`);
  }

  deleteUploadByurl(key: string) {
    return this.http.delete(`${this.apiUrl}/newleave/delete/filedeletebyurl?key=${key}`);
  }

  getLeaveById(id: number) {
    return this.http.get<Leave>(`${this.apiUrl}/newleave/${id}`);
  }

  getUserLeaveByUser(id: number){
    return this.http.get<UserLeave[]>(`${this.apiUrl}/userLeave/byuser/${id}`);
  }

  getLeaveType(filterValue?: string, page?: number, pagesize?:number): Observable<LeaveType[]> {
    return this.http.get<LeaveType[]>(this.apiUrl + `/leaveType/find/?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  deleteLeaveType(id: number) {
    return this.http.delete(this.apiUrl + "/leaveType/" + id);
  }

  updateLeaveType(id: number, data: any): Observable<LeaveType> {
    return this.http.patch<LeaveType>(this.apiUrl + "/leaveType/" + id, data);
  }

  addLeaveType(data:any){
    return this.http.post(this.apiUrl+'/leaveType/', data)
  }

  uploadImage(file: any): Observable<any> {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append("file", file, file.name);
      return this.http.post(`${this.apiUrl}/newleave/fileupload`, formData);
    }
    return throwError(() => new Error("Invalid file type"));
  }

  addEmergencyLeave(data:any){
    return this.http.post(this.apiUrl+'/newleave/emergencyLeave', data)
  }

  updatemergencyLeave(data:any, id: number){
    return this.http.patch(this.apiUrl +'/newleave/updateemergencyLeave/'+ id, data)
  }

  addLeave(data:any){
    return this.http.post(this.apiUrl+'/newleave/employeeLeave', data)
  }

  updateLeave(id: number, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/newleave/updateemployeeleave/${id}`, data);
  }


  getLeavesPaginatedByRm(rmId: number, search?: string, page?: number, pageSize?: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/newleave/findbyrm/${rmId}?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  getReport(year: number, page?: number, pageSize?: number, search?: string):Observable<any>{
    return this.http.get(`${this.apiUrl}/newleave/all/report?year=${year}&page=${page}&pageSize=${pageSize}&search=${search}`);
  }


  // for setting app password....................................
  getUserEmail(id: number){
    return this.http.get<UserLeave[]>(`${this.apiUrl}/useremail/byuseridforleave/${id}`);
  }

  getUserLeaveForEncash(year: number){
    return this.http.get<any[]>(`${this.apiUrl}/userLeave/forencashment/${year}`);
  }


  getMonthlyLeaveDays(startDate: any, endDate: any){
    return this.http.get<any[]>(`${this.apiUrl}/newleave/find/monthlyleavedays?startDate=${startDate}&endDate=${endDate}`);
  }

  getUserLeave(userId: number, typeid: number): Observable<UserLeave> {
    return this.http.get<UserLeave>(`${this.apiUrl}/userLeave/byuserandtype/${userId}/${typeid}`);
  }

  updateUserLeave(data: any): Observable<UserLeave> {
    return this.http.patch<UserLeave>(`${this.apiUrl}/userLeave/update`, data);
  }

  getLeaveCounts(userId: number, ltId: number, year: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/userLeave/leavecount/${userId}/${ltId}/${year}`);
  }

}
