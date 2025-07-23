import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BackupService } from '@services/backup.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-backup-list',
  standalone: true,
  imports: [CommonModule,
    MatDialogModule, MatButtonModule,
    NgxPaginationModule,
    MatPaginatorModule,
    MatPaginator,
    FormsModule,
    MatIconButton,
    MatDatepickerModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
  ],
  templateUrl: './backup-list.component.html',
  styleUrl: './backup-list.component.scss'
})



export class BackupListComponent implements OnInit {
snackBar =inject(MatSnackBar)
  constructor(private backupService: BackupService,private http: HttpClient,private dialog: MatDialog) { }


public searchText: string;

  ngOnInit(): void {
    this.loadBackups();
  }
search(event: any): void {
  const selectedDate = event.value;
  if (selectedDate && !isNaN(selectedDate.getTime())) {
    const normalizedDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const formattedDate = this.formatDate(normalizedDate);
    this.currentPage = 1; 
    this.loadBackups(formattedDate);
  } else {
    console.error('Invalid date selected:', selectedDate);
  }
}

selectedDate: Date | null = null;


  onDateChange(value: string): void {
    this.selectedDate = new Date(value);
    const formattedDate = this.formatDate(this.selectedDate);
    this.searchBackupsByDate(formattedDate);
  }
    searchBackupsByDate(formattedDate: string): void {
    this.backups = this.backups.filter(b => b.date === formattedDate);
  }

  formatDate(date: Date | null): string {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' }); 
    const year = date.getFullYear();
    return `${day} ${month} ${year}`; 
  }

  resetDate(): void {
    window.location.reload();
  }


  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    console.log(this.currentPage);
    
    this.pageSize = event.pageSize;
    this.loadBackups();
  }

  loadBackupss(): void {
    this.loading = true;
    this.error = null;
    
    this.backupService.getBackups().subscribe({
      next: (response) => {
        this.backups = response.backups;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load backups';
        this.loading = false;
      }
    });
  }

backups: any[] = []; 
loading = false;
error: string | null = null;
currentPage = 1;
pageSize = 10;
totalCount = 0;
totalItems=0;

loadBackups(formattedDate?: string): void {
  this.loading = true;
  this.error = null;

  const searchValue = formattedDate || this.searchText || '';
  const currentPage = this.currentPage || 1;
  const pageSize = this.pageSize || 10;

  this.backupService.getPaginatedBackups(searchValue, currentPage, pageSize).subscribe({
    next: (response: any) => {
      this.backups = response?.backups || [];
      this.totalItems = response?.count || 0;
      this.loading = false;
    },
    error: (err) => {
      this.error = err.error?.message || 'Failed to load backups';
      this.backups = [];
      this.loading = false;
    }
  });
}

previousPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.loadBackups();
  }
}

nextPage() {
  if (this.currentPage * this.pageSize < this.totalCount) {
    this.currentPage++;
    this.loadBackups();
  }
}

totalPages(): number {
  return Math.ceil(this.totalCount / this.pageSize);
}



restoreBackup(backupPath: string) {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '350px',
    data: { message: `Are you sure you want to restore this backup?\n${backupPath}` }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.backupService.restoreBackup(backupPath).subscribe({
        next: res => {
              this.snackBar.open('Backup restored successfully.', 'Close', {
          duration: 3000,
        });
        },
        error: err => {
          console.error('Restore failed:', err);
        }
      });
    }
  });
}





  downloadBackup(backup: any): void {
    this.backupService.getDownloadUrl(backup.path).subscribe({
      next: (response) => {
        // For direct download
        window.open(response.url, '_blank');
        
        // Or to download via Angular (if CORS allows)
        // const fileName = backup.name.replace(/ /g, '_') + (backup.path.endsWith('.dump') ? '.dump' : '.sql');
        // saveAs(response.url, fileName);
      },
      error: (err) => {
        alert(`Failed to get download URL: ${err.error?.message || err.message}`);
      }
    });
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }

  // Add these to your component class

}