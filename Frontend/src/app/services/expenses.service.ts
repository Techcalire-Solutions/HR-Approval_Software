import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense } from '../common/interfaces/expense';

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

}
