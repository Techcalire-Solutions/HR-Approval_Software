import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PageService {

  constructor(private _http:HttpClient) { }

 url = 'http://localhost:8000'
  
  




}
