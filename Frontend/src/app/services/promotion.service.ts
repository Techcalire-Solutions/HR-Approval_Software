import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Promotion } from '../common/interfaces/users/promotion';

@Injectable({
  providedIn: 'root'
})
export class PromotionService {

  private desigData = new BehaviorSubject<any>(null);
  currentDesigData = this.desigData.asObservable();

  updateDesigData(data: any) {
    this.desigData.next(data);
  }
  private apiUrl = `${environment.apiUrl}/promotion`;

  constructor(private http: HttpClient) { }

  applyPromotion(promotion: Promotion): Observable<Promotion> {
    return this.http.post<Promotion>(this.apiUrl, promotion);
  }

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(this.apiUrl);
  }

  getPromotionById(id: number): Observable<Promotion[]> {
    return this.http.get<Promotion[]>(`${this.apiUrl}/${id}`);
  }
}
