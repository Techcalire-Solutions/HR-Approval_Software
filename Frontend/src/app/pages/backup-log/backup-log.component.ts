import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BackupService } from '@services/backup.service';
import { Backup } from '../../common/interfaces/backup/backup';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-backup-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backup-log.component.html',
  styleUrl: './backup-log.component.scss'
})
export class BackupLogComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.getBackupLog();
  }

  private backupService = inject(BackupService);
  backUpSub!: Subscription;
  backLogs: Backup[] = [];
  getBackupLog(){
    this.backUpSub = this.backupService.getBackupLog().subscribe((log: Backup[]) => {
      this.backLogs = log;
    });
  }
  ngOnDestroy(): void {
      this.backUpSub?.unsubscribe();
  }

}
