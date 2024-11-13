/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Payroll } from '../common/interfaces/payRoll/payroll';
import { AdvanceSalary } from '../common/interfaces/payRoll/advanceSalary';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }



  public savePayroll(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/payroll", data);
  }

  public getPayrollDetailsByUserId(id: number): Observable<Payroll>{
    return this.http.get<Payroll>(this.apiUrl+"/payroll/"+id);
  }

  
  getAdvanceSalary(): Observable<AdvanceSalary[]> {
    return this.http.get<AdvanceSalary[]>(`${this.apiUrl}/advanceSalary/findall`);
  }

  getNotCompletedAdvanceSalary(): Observable<AdvanceSalary[]> {
    return this.http.get<AdvanceSalary[]>(`${this.apiUrl}/advanceSalary/notcompleted`);
  }
  
  addAdvanceSalary(data: any) {
    return this.http.post(this.apiUrl+"/advanceSalary", data);
  }
  updateAdvanceSalary(id: number, data: any): Observable<AdvanceSalary> {
    return this.http.patch<AdvanceSalary>(`${this.apiUrl}/advanceSalary/update/` + id, data);
  }
  deleteAdvanceSalary(id: number) {
    return this.http.delete(`${this.apiUrl}/advanceSalary/` +id);
  }
  getPayroll(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payroll`);
  }

  getAdvanceSalaryByid(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/advanceSalary/findbyid/${id}`);
  }
}
