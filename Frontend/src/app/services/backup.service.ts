import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Backup } from '../common/interfaces/backup/backup';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackupService {
  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient)

  getBackupLog(): Observable<Backup[]>{
    return this.http.get<Backup[]>(this.apiUrl + '/backup/find')
  }
}
