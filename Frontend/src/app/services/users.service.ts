/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { User } from '../common/interfaces/user';
import { environment } from '../../environments/environment';
import { UserPersonal } from '../common/interfaces/user-personal';
import { UserPosition } from '../common/interfaces/user-position';
import { StatutoryInfo } from '../common/interfaces/statutory-info';
import { UserAccount } from '../common/interfaces/user-account';
import { UserDocument } from '../common/interfaces/user-document';
import { UserAssets } from '../common/interfaces/user-assets';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = environment.apiUrl;

  constructor(public http: HttpClient) { }

  getUser(search?:string, page?: number, pageSize?: number): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + `/user/find/?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  // addUser(user:User){
  //     return this.http.post(this.apiUrl, user);
  // }
  public addUser(data: any): Observable<any> {
    return this.http.post( this.apiUrl+'/user/add', data);
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

  deleteUser(id: number) {
    return this.http.delete(`${this.apiUrl}/user/delete/${id}`);
  }

  deleteUserImage(id: number, key?: string) {
    return this.http.delete(`${this.apiUrl}/user/filedelete?id=${id}&key=${key}`);
  }

  deleteUserImageByurl(key: string) {
    return this.http.delete(`${this.apiUrl}/user/filedeletebyurl/?key=${key}`);
  }

  getUserByRoleId(id:number):Observable<User>{
    return this.http.get<User>(this.apiUrl + '/user/findbyrole/'+id)
  }

  getUserById(id:number):Observable<User>{
    return this.http.get<User>(this.apiUrl + '/user/findone/'+id)
  }

  addUserPersonalDetails(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/personal/add', data);
  }

  addStautoryInfo(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/statutoryinfo/add', data);
  }

  addUserAccountDetails(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/account/add', data);
  }

  addUserPositionDetails(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/position/add', data);
  }

  getUserPersonalDetails(): Observable<UserPersonal[]> {
    return this.http.get<UserPersonal[]>( this.apiUrl + '/personal/find');
  }

  getUserPersonalDetailsByUser(id: number): Observable<UserPersonal> {
    return this.http.get<UserPersonal>( this.apiUrl + '/personal/findbyuser/' + id);
  }

  getUserPositionDetailsByUser(id: number): Observable<UserPosition> {
    return this.http.get<UserPosition>( this.apiUrl + '/position/findbyuser/' + id);
  }

  getUserStatutoryuDetailsByUser(id: number): Observable<StatutoryInfo> {
    return this.http.get<StatutoryInfo>( this.apiUrl + '/statutoryinfo/findbyuser/' + id);
  }

  getUserAcoountDetailsByUser(id: number): Observable<UserAccount> {
    return this.http.get<UserAccount>( this.apiUrl + '/account/findbyuser/' + id);
  }

  getReportingManagers(): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/getreportingmanager')
  }

  uploadUserDoc(formData: any): Observable<any> {
    return this.http.post(this.apiUrl + '/document/fileupload', formData);
  }

  addUserDocumentDetails(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/document/add', data);
  }

  updateUser(id: number, data: any){
    return this.http.patch(this.apiUrl + '/user/update/' + id, data);
  }

  updateUserPersonal(id: number, data: any){
    return this.http.patch(this.apiUrl + '/personal/update/' + id, data);
  }

  updateUserAccount(id: number, data: any){
    return this.http.patch(this.apiUrl + '/account/update/' + id, data);
  }

  updateUserStatutory(id: number, data: any){
    return this.http.patch(this.apiUrl + '/statutoryinfo/update/' + id, data);
  }

  updateUserPosition(id: number, data: any){
    return this.http.patch(this.apiUrl + '/position/update/' + id, data);
  }

  getUserDocumentsByUser(id: number): Observable<UserDocument[]> {
    return this.http.get<UserDocument[]>( this.apiUrl + '/document/findbyuser/' + id);
  }

  deleteUserDoc(id: number, key?: string) {
    return this.http.delete(`${this.apiUrl}/document/filedelete?id=${id}&key=${key}`);
  }

  deleteUserDocByurl(key: string) {
    return this.http.delete(`${this.apiUrl}/document/filedeletebyurl/?key=${key}`);
  }

  deleteUserDocComplete(id: number) {
    return this.http.delete(`${this.apiUrl}/document/delete/${id}`);
  }

  updateUserDocumentDetails(id: number, data: any): Observable<any> {
    return this.http.patch( this.apiUrl + '/document/update/' + id, data);
  }

  resetPassword(id: number, data: any){
    return this.http.patch(this.apiUrl + '/user/resetpassword/' + id, data);
  }

  updateUserStatus(data: any, id: number): Observable<any> {
    return this.http.patch( this.apiUrl+'/user/statusupdate/' + id, data);
  }

  getProbationEmployees(): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/underprobation')
  }

  getConfirmedEmployees(): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/confirmed')
  }

  confirmEmployee(id: number, note: string): Observable<any> {
    return this.http.get( this.apiUrl+`/user/confirmemployee/${id}/?note=${note}`);
  }

  getBirthdays():Observable<UserPersonal[]>{
    return this.http.get<UserPersonal[]>( this.apiUrl + '/personal/birthdays');
  }

  getJoining():Observable<UserPersonal[]>{
    return this.http.get<UserPersonal[]>( this.apiUrl + '/personal/joiningday');
  }

  getProbationDues():Observable<User[]>{
    return this.http.get<User[]>( this.apiUrl + '/personal/dueprobation');
  }

  getDirectors(): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/getdirectors')
  }

  getUserByRm(id: number): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/getbyrm/'+id)
  }

  resignEmployee(id: number): Observable<any> {
    return this.http.get( this.apiUrl+'/user/resignemployee/' + id);
  }

  getUserAssets(department?: string): Observable<UserAssets[]>{
    return this.http.get<UserAssets[]>(this.apiUrl + `/asset/find?department=${department}`)
  }

  addUserAssets(data: any): Observable<UserAssets[]>{
    return this.http.post<UserAssets[]>(this.apiUrl + `/asset/save`, data)
  }

  getUserAssetsByUser(userId: number): Observable<UserAssets>{
    return this.http.get<UserAssets>(this.apiUrl + `/asset/findbyuser/${userId}`)
  }

  updateUserAssets(data: any, id: number): Observable<UserAssets[]>{
    return this.http.patch<UserAssets[]>(this.apiUrl + `/asset/update/${id}`, data)
  }

}
