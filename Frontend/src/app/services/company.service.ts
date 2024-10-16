import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Team } from '../common/interfaces/team';
import { environment } from '../../environments/environment';
import { Company } from '../common/interfaces/company';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }
  getCompany(): Observable<any> {
    return this.http.get(`${this.apiUrl}/company`);
  }
  getSuppliers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/company/suppliers`);
  }
  getCustomers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/company/customers`);
  }

  public addCompany(data: any): Observable<any> {
    return this.http.post( this.apiUrl + '/company', data);
  }
  updateCompany(id: number, data: any): Observable<Company> {
    return this.http.patch<Company>(`${this.apiUrl}/company/` + id, data);
  }
  deleteCompany(id: number) {
    return this.http.delete(`${this.apiUrl}/company/` +id);
  }
}
