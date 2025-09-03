/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Kpi } from '../common/interfaces/kpi';

@Injectable({
  providedIn: 'root'
})
export class KpiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getKpi(filterValue?: string, page?: number, pagesize?:number): Observable<Kpi[]> {
    return this.http.get<Kpi[]>(this.apiUrl + `/kpi/find/?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  public addKpi(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/kpi", data);
  }

  updateKpi(id: number, data: any): Observable<Kpi> {
    return this.http.patch<Kpi>(this.apiUrl + "/kpi/" + id, data);
  }

  public getKpiById(id: number): Observable<Kpi>{
    return this.http.get<Kpi>(this.apiUrl + '/kpi/findbyid/'+id);
  }

  deleteKpi(id: number) {
    return this.http.delete(this.apiUrl + "/kpi/" + id);
  }
}
