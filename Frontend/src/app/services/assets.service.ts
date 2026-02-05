/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Assets } from '../common/interfaces/assets/assets';
import { map, Observable, tap } from 'rxjs';
import { UserAssetDetail } from '../common/interfaces/users/user-asset-details';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {

  private apiUrl = environment.apiUrl;

  private http = inject(HttpClient);

  getAssets(filterValue?: string, page?: number, pagesize?:number): Observable<Assets[]>{
    return this.http.get<Assets[]>(this.apiUrl + `/companyasset/find?search=${filterValue}&page=${page}&pageSize=${pagesize}`)
  }

  addAssets(data: any){
    return this.http.post(this.apiUrl + `/companyasset/add`, data)
  }

  deleteAssets(id: number){
    return this.http.delete(this.apiUrl + `/companyasset/delete/${id}`)
  }

  updateAssets(id: number, data: any){
    return this.http.patch(this.apiUrl + `/companyasset/update/${id}`, data)
  }

  getAssetByid(id: number){
    return this.http.delete(this.apiUrl + `/companyasset/findbyid/${id}`)
  }

  getAssignedUsers(id: number){
    return this.http.get(this.apiUrl + `/asset/getassigneduser/${id}`)
  }

  addUserAssets(data: any) {
    return this.http.post(this.apiUrl + `/asset`, data).pipe(
      map((response: any) => response.data)
    );
  }
  // addUserAssets(data: any){
  //   return this.http.post(this.apiUrl + `/asset`, data).pipe(
  //     tap((res) => console.log('Response from backend:', res))
  //   );
  // }

  editUserAssets(data: any, id: number){
    return this.http.patch(this.apiUrl + `/asset/${id}`, data).pipe(
      tap((res) => console.log('Response from backend:', res))
    );
  }

  deleteUserAssets(id: number){
    return this.http.delete(this.apiUrl + `/asset/${id}`)
  }


  getUserAssets(filterValue?: string, page?: number, pagesize?:number): Observable<Assets[]>{
    return this.http.get<Assets[]>(this.apiUrl + `/asset/find?search=${filterValue}&page=${page}&pageSize=${pagesize}`)
  }

  addAssetDetails(data: any){
    return this.http.post(this.apiUrl + `/assetDetails`, data)
  }

  updateUserAssets(data: any, id: number): Observable<UserAssetDetail[]>{
    return this.http.patch<UserAssetDetail[]>(this.apiUrl + `/assetDetails/${id}`, data)
  }

  returnUserAssets(data: any, id: number): Observable<UserAssetDetail>{
    return this.http.patch<UserAssetDetail>(this.apiUrl + `/assetDetails/return-asset/${id}`, data)
  }

  getUserAssetsByUser(userId: number): Observable<UserAssetDetail[]>{
    return this.http.get<UserAssetDetail[]>(this.apiUrl + `/assetDetails/findbyuser/${userId}`)
  }
}
