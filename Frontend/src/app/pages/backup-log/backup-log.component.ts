/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { BackupService } from '@services/backup.service';
import { Backup } from '../../common/interfaces/backup/backup';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {MatExpansionModule, MatExpansionPanel} from '@angular/material/expansion';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-backup-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule],
  templateUrl: './backup-log.component.html',
  styleUrl: './backup-log.component.scss'
})
export class BackupLogComponent implements OnInit, OnDestroy{
  token: string;
  ngOnInit(): void {
    this.getBackupLog();
  }

  private fb = inject(FormBuilder);
  dateForm = this.fb.group({
    selectedDate: ['']
  });

  private backupService = inject(BackupService);
  backUpSub!: Subscription;
  backLogs: Backup[] = [];
  groupedLogs: { date: string; logs: Backup[] }[] = [];
  getBackupLog(): void {
    this.backUpSub = this.backupService.getBackupLog().subscribe((log: Backup[]) => {
      this.backLogs = log;

      // Group logs by date
      const grouped = log.reduce((acc, curr) => {
        const date = new Date(curr.backUpTime).toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(curr);
        return acc;
      }, {} as { [key: string]: Backup[] });

      // Convert grouped object to an array for easier handling
      this.groupedLogs = Object.entries(grouped).map(([date, logs]) => ({ date, logs }));
    })
  }


  private http = inject(HttpClient)
  excelUrl: SafeResourceUrl;
  name : string;
  rawFile: string;
  extractData(url: string, name: string): void {
    this.rawFile = url;
    this.name = name;
    this.closeAllPanels()
    const fileUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    this.excelUrl = this.sanitizeUrl(fileUrl);
  }

  private sanitizer = inject(DomSanitizer)
  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  @ViewChildren(MatExpansionPanel) panels!: QueryList<MatExpansionPanel>;
  closeAllPanels() {
    this.panels.forEach((panel: any) => panel.close());
  }

  async downloadExcel(): Promise<void> {
    const fileUrl = this.rawFile; // Your file URL
    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Get the response as a Blob
      const blob = await response.blob();

      // Create a URL for the Blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement('a');
      link.href = url;

      // Set the filename and file type
      link.download = this.name; 
      document.body.appendChild(link);

      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  }



  ngOnDestroy(): void {
      this.backUpSub?.unsubscribe();
  }

}
