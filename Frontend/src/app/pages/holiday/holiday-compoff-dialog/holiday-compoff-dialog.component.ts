/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { HolidayService } from '@services/holiday.service';

@Component({
  selector: 'app-holiday-compoff-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './holiday-compoff-dialog.component.html',
  styleUrl: './holiday-compoff-dialog.component.scss'
})
export class HolidayCompoffDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<HolidayCompoffDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  private readonly holidayService = inject(HolidayService);
  private readonly router = inject(Router);

  holiday: any;
  employees: any[] = [];
  loading: boolean = true;
  error: string | null = null;

  ngOnInit(): void {
    this.holiday = this.data?.holiday;
    if (this.holiday?.id) {
      this.fetchDetails(this.holiday.id);
    } else {
      this.loading = false;
      this.error = 'No holiday selected';
    }
  }

  fetchDetails(holidayId: number): void {
    this.loading = true;
    this.holidayService.getHolidayCompoffDetails(holidayId).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.holiday) {
          this.holiday = res.holiday;
        }
        this.employees = res.employees || [];
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load comp-off details';
      }
    });
  }

  editAllotment(): void {
    this.dialogRef.close();
    this.router.navigateByUrl('/login/holiday/compo-off/' + this.holiday.id);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

