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
      getBackups(): Observable<{success: boolean, backups: Backup[]}> {
    return this.http.get<{success: boolean, backups: Backup[]}>(`${this.apiUrl}/backupapi/backups`);
  }

  // backup.service.ts
getPaginatedBackups(search: string = '', page: number = 1, pageSize: number = 10): Observable<{ success: boolean; backups: Backup[]; count: number }> {
  const url = `${this.apiUrl}/backupapi/backups/paginatedlist?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}`;
  return this.http.get<{ success: boolean; backups: Backup[]; count: number }>(url);
}

  restoreBackup(backupPath: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/backupapi/restore/manual`, { backupPath });
  }

  getDownloadUrl(backupPath: string): Observable<{url: string}> {
    return this.http.post<{url: string}>(`${this.apiUrl}/backupapi/backups/generate-url`, { backupPath });
  }
}
