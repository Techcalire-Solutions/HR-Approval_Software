import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { PerformaInvoice } from '../common/interfaces/performaInvoice';
import { PerformaInvoiceStatus } from '../common/interfaces/performa-invoice-status';
import { Role } from '../common/interfaces/role';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  url = environment.apiUrl;

  constructor(private _http:HttpClient) { }

  uploadInvoice(file: any): Observable<any> {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append("file", file, file.name);
      return this._http.post(this.url + '/invoice/fileupload', formData);
    } else {
      // Handle the case where 'file' is not a File object
      return throwError("Invalid file type");
    }
  }

  deleteInvoice(id: number, fileName: string){
    return this._http.delete(this.url + `/invoice/filedelete/?id=${id}&fileName=${fileName}`);
  }

  getPI(status?: string): Observable<PerformaInvoice[]>{
    return this._http.get<PerformaInvoice[]>(this.url + `/performaInvoice/find/?status=${status}`);
  }

  getPIBySP(status?: string, search?: string, currentPage?: number, pageSize?: number): Observable<PerformaInvoice[]>{
    return this._http.get<PerformaInvoice[]>(this.url + `/performaInvoice/findbysp/?status=${status}&search=${search}&page=${currentPage}&pageSize=${pageSize}`);
  }

  getPIByKAM(status?: string, search?: string, currentPage?: number, pageSize?: number): Observable<PerformaInvoice[]>{
    return this._http.get<PerformaInvoice[]>(this.url + `/performaInvoice/findbkam/?status=${status}&search=${search}&page=${currentPage}&pageSize=${pageSize}`);
  }

  getPIByAM(status?: string, search?: string, currentPage?: number, pageSize?: number): Observable<PerformaInvoice[]>{
    return this._http.get<PerformaInvoice[]>(this.url + `/performaInvoice/findbyam/?status=${status}&search=${search}&page=${currentPage}&pageSize=${pageSize}`);
  }

  getPIByMA(status?: string, search?: string, currentPage?: number, pageSize?: number): Observable<PerformaInvoice[]>{
    return this._http.get<PerformaInvoice[]>(this.url + `/performaInvoice/findbyma/?status=${status}&search=${search}&page=${currentPage}&pageSize=${pageSize}`);
  }

  addPI(data: any){
    return this._http.post(this.url + '/performaInvoice/save', data);
  }

  updatePI(data: any, id: number){
    return this._http.patch(this.url + '/performaInvoice/update/'+ id, data);
  }

  getPIById(id: number): Observable<PerformaInvoice>{
    return this._http.get<PerformaInvoice>(this.url + '/performaInvoice/findbyid/'+id);
  }

  getPIStatusByPIId(id: number): Observable<PerformaInvoiceStatus>{
    return this._http.get<PerformaInvoiceStatus>(this.url + '/invoiceStatus/findbypi/'+id);
  }

  updatePIStatus(data: any){
    return this._http.post(this.url + '/invoiceStatus/updatestatus', data);
  }

  updatePIStatusWithBankSlip(data: any){
    return this._http.post(this.url + '/invoiceStatus/updatestatustobankslip', data);
  }

  addBankSlip(data: any, id: number){
    return this._http.patch(this.url + '/performaInvoice/bankslip/' + id, data);
  }
  getRole(filterValue?: string, page?: number, pagesize?:number): Observable<Role[]> {
    return this._http.get<Role[]>(this.url + `/role/find/?search=${filterValue}&page=${page}&pageSize=${pagesize}`);
  }
}
