/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Assets } from '../common/interfaces/assets/assets';
import { Observable } from 'rxjs';

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
}
