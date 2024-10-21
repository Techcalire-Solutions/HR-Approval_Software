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

  uploadInvoice(formData: FormData): Observable<any> {
    return this._http.post(this.url + '/invoice/fileupload', formData);
  }

  uploadBankSlip(file: any): Observable<any> {
    if (file instanceof File) {
      const formData = new FormData();
      formData.append("file", file, file.name);
      return this._http.post(this.url + '/invoice/bankslipupload', formData);
    } else {
      // Handle the case where 'file' is not a File object
      return throwError("Invalid file type");
    }
  }

  deleteUploaded(id: number, i: number, key?: string) {
    console.log(i);

    return this._http.delete(`${this.url}/invoice/filedelete?id=${id}&index=${i}&key=${key}`);
  }

  deleteUploadByurl(key: string) {
    return this._http.delete(`${this.url}/invoice/filedeletebyurl/?key=${key}`);
  }

  // deleteInvoice(id: number, fileName: string){
  //   return this._http.delete(this.url + `/invoice/filedelete/?id=${id}&fileName=${fileName}`);
  // }

  deleteInvoice(id: number) {
    return this._http.delete(`${this.url}/performaInvoice/${id}`);
  }


  getPI(status?: string, currentPage?: number, pageSize?: number): Observable<any[]>{
    return this._http.get<any[]>(this.url + `/performaInvoice/find/?status=${status}&page=${currentPage}&pageSize=${pageSize}`);
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
  getPIByAdmin(status?: string, search?: string, currentPage?: number, pageSize?: number): Observable<PerformaInvoice[]>{
    return this._http.get<PerformaInvoice[]>(this.url + `/performaInvoice/findbyadmin/?status=${status}&search=${search}&page=${currentPage}&pageSize=${pageSize}`);
  }

  addPI(data: any){
    return this._http.post(this.url + '/performaInvoice/save', data);
  }

  addPIByKAM(data: any){
    return this._http.post(this.url + '/performaInvoice/saveByKAM', data);
  }

  addPIByAM(data: any){
    return this._http.post(this.url + '/performaInvoice/saveByAM', data);
  }

  getDashboardPI(status?: string, currentPage?: number, pageSize?: number): Observable<any[]>{
    return this._http.get<any[]>(this.url + `/performaInvoice/dashboard/?status=${status}&page=${currentPage}&pageSize=${pageSize}`);
  }


  updatePIBySE(data: any, id: number){
    return this._http.patch(this.url + '/performaInvoice/updateBySE/'+ id, data);
  }

  updatePIByKAM(data: any, id: number){
    return this._http.patch(this.url + '/performaInvoice/updateByKAM/'+ id, data);
  }

  updatePIByAM(data: any, id: number){
    return this._http.patch(this.url + '/performaInvoice/updateByAM/'+ id, data);
  }
  updatePIByAdminSuperAdmin(data: any, id: number){
    return this._http.patch(this.url + '/performaInvoice/updatePIByAdminSuperAdmin/'+ id, data);
  }

  getPIById(id: number): Observable<any>{
    return this._http.get<any>(this.url + '/performaInvoice/findbyid/'+id);
  }

  getPIStatusByPIId(id: number, search: string): Observable<PerformaInvoiceStatus[]>{
    return this._http.get<PerformaInvoiceStatus[]>(this.url + `/invoiceStatus/findbypi/?search=${search}&id=${id}`);
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
  getRoleById(id: number): Observable<Role>{
    return this._http.get<Role>(this.url + '/role/'+id);
  }

  getAdminReports(data: any){
    return this._http.patch<any[]>(this.url + '/performaInvoice/getforadminreport', data);
  }

  excelExport(data: any){
    return this._http.post<any[]>(this.url + '/invoice/excelupload', data);
  }

  getexcel(){
    return this._http.get(this.url + '/invoice/getexcel', { responseType: 'arraybuffer' });
  }
}
