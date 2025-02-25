/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Payroll } from '../common/interfaces/payRoll/payroll';
import { AdvanceSalary } from '../common/interfaces/payRoll/advanceSalary';
import { PayrollLog } from '../common/interfaces/payRoll/payroll-log';
import { MonthlyPayroll } from '../common/interfaces/payRoll/monthlyPayroll';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  public savePayroll(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/payroll", data);
  }

  public updatePayroll(id: number, data: any): Observable<any> {
    return this.http.patch(this.apiUrl+"/payroll/"+id, data);
  }

  public getPayrollDetailsByUserId(id: number): Observable<Payroll>{
    return this.http.get<Payroll>(this.apiUrl+"/payroll/"+id);
  }

  getPayroll(): Observable<any> {
    return this.http.get(`${this.apiUrl}/payroll`);
  }

  getAdvanceSalary(search: string): Observable<AdvanceSalary[]> {
    return this.http.get<AdvanceSalary[]>(`${this.apiUrl}/advanceSalary/findall?search=${search}`);
  }

  closeAdvanceSalary(id: number, data: any): Observable<AdvanceSalary> {
    return this.http.patch<AdvanceSalary>(`${this.apiUrl}/advanceSalary/closeadvance/${id}`, data);
  }

  getNotCompletedAdvanceSalary(search?: string, page?: number, pageSize?: number): Observable<AdvanceSalary[]> {
    return this.http.get<AdvanceSalary[]>(`${this.apiUrl}/advanceSalary/notcompleted?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  addAdvanceSalary(data: any) {
    return this.http.post(this.apiUrl+"/advanceSalary", data);
  }
  updateAdvanceSalary(id: number, data: any): Observable<AdvanceSalary> {
    return this.http.patch<AdvanceSalary>(`${this.apiUrl}/advanceSalary/update/` + id, data);
  }
  deleteAdvanceSalary(id: number) {
    return this.http.delete(`${this.apiUrl}/advanceSalary/delete/` +id);
  }

  getAdvanceSalaryByid(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/advanceSalary/findbyid/${id}`);
  }

  getAdvanceSalaryByUserId(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/advanceSalary/findbyuserid/${id}`);
  }

  
  getAllAdvanceSalaryByUserId(id: number, search?: string, page?: number, pageSize?: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/advanceSalary/findbyuseridall/${id}?search=${search}&page=${page}&pageSize=${pageSize}`);
  }

  getPayrollLogByUser(id: number): Observable<PayrollLog[]>{
    return this.http.get<PayrollLog[]>(`${this.apiUrl}/payrolllog/getbyuser/${id}`);
  }

  monthlyPayroll(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/monthlypayroll/save", data);
  }

  updateMonthlyPayroll(data: any): Observable<any> {
    return this.http.post(this.apiUrl+"/monthlypayroll/update", data);
  }

  public updateMPStatus(data: any): Observable<MonthlyPayroll> {
    return this.http.patch<MonthlyPayroll>(this.apiUrl+`/monthlypayroll/statusupdate`, data);
  }

  getMonthlyPayroll(filterValue?: string, page?: number, pagesize?:number): Observable<any> {
    return this.http.get(this.apiUrl+`/monthlypayroll/find?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }

  getMonthlyPayrollForYTD(fromDate?: any, toDate?: any): Observable<any> {
    return this.http.get(this.apiUrl+`/monthlypayroll/ytd?fromDate=${fromDate}&toDate=${toDate}`);
  }

  getMonthlyPayrollByUser(id: number, filterValue?: string, page?: number, pagesize?:number): Observable<any> {
    return this.http.get(this.apiUrl+`/monthlypayroll/findbyuser/${id}?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }


  // getMonthlyPayrollByUser(id: number): Observable<any> {
  //   return this.http.get(this.apiUrl+"/monthlypayroll/findbyuser/" + id);
  // }

  getMonthlyPayrollById(id: number): Observable<any> {
    return this.http.get(this.apiUrl+"/monthlypayroll/findbyid/" + id);
  }


  getMonthlyPayrollByPayedFor(payedForValue: string): Observable<Payroll[]> {
    return this.http.get<Payroll[]>(this.apiUrl+`/monthlypayroll/bypayedfor/?payedFor=${payedForValue}`);
  }

  sendEmailWithExcel(formData: any){
    return this.http.post(this.apiUrl+"/monthlypayroll/send-email", formData);
  }

  sendPayrollEmail(data: any){
    return this.http.post(this.apiUrl+"/monthlypayroll/send-payroll-email", data);
  }

}
