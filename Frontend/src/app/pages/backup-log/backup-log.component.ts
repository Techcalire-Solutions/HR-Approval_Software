/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BackupService } from '@services/backup.service';
import { Backup } from '../../common/interfaces/backup/backup';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {MatExpansionModule} from '@angular/material/expansion';

@Component({
  selector: 'app-backup-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatExpansionModule],
  templateUrl: './backup-log.component.html',
  styleUrl: './backup-log.component.scss'
})
export class BackupLogComponent implements OnInit, OnDestroy{
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

  ngOnDestroy(): void {
      this.backUpSub?.unsubscribe();
  }

}
