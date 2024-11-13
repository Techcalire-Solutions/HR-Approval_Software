import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { Expense } from '../common/interfaces/payments/expense';
import { ExcelLog } from '../common/interfaces/payments/excel-log';

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {

  url = environment.apiUrl;
  private http = inject(HttpClient);

  addExpense(data: any){
    return this.http.post(this.url + '/expense/save', data);
  }

  getExpense(): Observable<Expense[]>{
    return this.http.get<Expense[]>(this.url + '/expense/find');
  }

  getExpenseByUser(search?: string, currentPage?:number, pageSize?:number, isFlow?: boolean): Observable<Expense[]>{
    return this.http.get<Expense[]>(this.url + `/expense/findbyuser/?search=${search}&page=${currentPage}&pageSize=${pageSize}&isFLow=${isFlow}`);
  }

  updateStatus(data: any){
    return this.http.post(this.url + '/expense/updatestatus', data);
  }

  uploadExpense(formData: any): Observable<any> {
    return this.http.post(this.url + '/expense/fileupload', formData);
  }

  addBankSlip(data: any, id: number){
    return this.http.patch(this.url + '/expense/bankslip/' + id, data);
  }

  getExpenseById(id: number): Observable<Expense>{
    return this.http.get<Expense>(this.url + '/expense/findbyid/'+id);
  }

  deleteUploaded(id: number, i: number, key?: string) {
    return this.http.delete(`${this.url}/expense/filedelete?id=${id}&index=${i}&key=${key}`);
  }

  deleteUploadByurl(key: string) {
    return this.http.delete(`${this.url}/expense/filedeletebyurl/?key=${key}`);
  }

  updateExpense(data: any, id: number){
    return this.http.patch(this.url + '/expense/update/'+ id, data);
  }

  deleteExpense(id: number) {
    return this.http.delete(`${this.url}/expense/${id}`);
  }

  getExpenseReports(data: any){
    return this.http.patch<any[]>(this.url + '/expense/getforadminreport', data);
  }

  reportExport(data: any){
    return this.http.post<any[]>(this.url + '/expense/download-excel', data);
  }

  getExcelLog(): Observable<ExcelLog[]>{
    return this.http.get<ExcelLog[]>(this.url + '/excelLog/findexpenses');
  }
}
