/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { StatutoryInfo } from '../common/interfaces/users/statutory-info';
import { User } from '../common/interfaces/users/user';
import { UserAccount } from '../common/interfaces/users/user-account';
import { UserAssets } from '../common/interfaces/users/user-assets';
import { UserDocument } from '../common/interfaces/users/user-document';
import { UserPersonal } from '../common/interfaces/users/user-personal';
import { UserPosition } from '../common/interfaces/users/user-position';
import { UserQualification } from '../common/interfaces/users/user-qualification';
import { Nominee } from '../common/interfaces/users/nominee';


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

  getUserPositionDetails(): Observable<UserPosition[]> {
    return this.http.get<UserPosition[]>( this.apiUrl + '/position');
  }

  getUserStatutoryuDetailsByUser(id: number): Observable<StatutoryInfo> {
    return this.http.get<StatutoryInfo>( this.apiUrl + '/statutoryinfo/findbyuser/' + id);
  }

  getUserQualDetailsByUser(id: number): Observable<UserQualification> {
    return this.http.get<UserQualification>( this.apiUrl + '/qualification/findbyuser/' + id);
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

  updateUserImage(id: number, data: any){
    return this.http.patch(this.apiUrl + '/user/imageupdate/' + id, data);
  }

  updateUserPersonal(id: number, data: any){
    return this.http.patch(this.apiUrl + '/personal/update/' + id, data);
  }

  addUserAccountDetails(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/account/add', data);
  }

  getUserAcoountDetailsByUser(id: number): Observable<UserAccount> {
    return this.http.get<UserAccount>( this.apiUrl + '/account/findbyuser/' + id);
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

  getSeparated(): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/getseparated')
  }

  getUserByRm(id: number): Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl + '/user/getbyrm/'+id)
  }

  resignEmployee(id: number, data: any): Observable<any> {
    return this.http.patch( this.apiUrl+'/user/resignemployee/' + id, data);
  }

  updateSeparationNote(id: number, data: any){
    return this.http.patch(this.apiUrl + '/user/editnote/' + id, data);
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

  updateDesignation(id: number, data: any){
    return this.http.patch<UserPosition[]>(this.apiUrl + `/position/updaterole/${id}`, data)
  }

  addUserQualification(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/qualification/save', data);
  }

  updateUserQualification(data: any, id: number): Observable<UserQualification[]>{
    return this.http.patch<UserQualification[]>(this.apiUrl + `/qualification/update/${id}`, data)
  }

  addUserNomineeDetails(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/nominee/add', data);
  }

  getUserNomineeDetailsByUser(id: number): Observable<Nominee> {
    return this.http.get<Nominee>( this.apiUrl + '/nominee/findbyuser/' + id);
  }

  updateUserNominee(id: number, data: any){
    return this.http.patch(this.apiUrl + '/nominee/update/' + id, data);
  }

  // --------------------------------------------------------------------------
  addUserEmail(data: any){
    return this.http.post(this.apiUrl + '/useremail/add', data);
  }

}
