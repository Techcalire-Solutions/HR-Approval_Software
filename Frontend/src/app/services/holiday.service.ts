/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Holidays } from '../common/interfaces/leaves/holidays';
import { CompoOff } from '../common/interfaces/leaves/compo-off';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {

    private readonly apiUrl = environment.apiUrl;
    private readonly http = inject(HttpClient)
  
    getHolidays(filterValue?: string, page?: number, pagesize?:number): Observable<Holidays[]>{
      return this.http.get<Holidays[]>(this.apiUrl + `/holidays/find?search=${filterValue}&page=${page}&pageSize=${pagesize}`)
    }

    getHolidayByDate(date: any): Observable<Holidays[]>{
      return this.http.get<Holidays[]>(this.apiUrl + `/holidays/holidaybydate?date=${date}`)
    }

    getHolidayByYear(year: number): Observable<Holidays[]>{
      return this.http.get<Holidays[]>(this.apiUrl + `/holidays/holidaysbyyear?year=${year}`)
    }

    getHolidayByName(search: string): Observable<Holidays[]>{
      return this.http.get<Holidays[]>(this.apiUrl + `/holidays/byname?search=${search}`)
    }
    getAllHolidays(): Observable<Holidays[]>{
      return this.http.get<Holidays[]>(this.apiUrl + `/holidays/findall`)
    }


    deleteHolidays(id: number){
      return this.http.delete(this.apiUrl + '/holidays/delete/'+id)
    }

    deleteHolidaysByYear(ids: number[]){
      console.log(ids);
      
      return this.http.patch(this.apiUrl + '/holidays/byyear', ids)
    }

    updateHolidays(id: number, data: any): Observable<Holidays>{
      return this.http.patch<Holidays>(this.apiUrl + `/holidays/updateholiday/${id}`, data)
    }

    addHolidays(data:any){
      return this.http.post(this.apiUrl+'/holidays/save', data)
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

    uploadHolidays(formData: FormData){
      return this.http.post(`${environment.apiUrl}/holidays/upload`, formData)
    }
}
