/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { HolidayService } from '@services/holiday.service';
import { Subscription } from 'rxjs';
import { EmployeeCompoffDetailDialogComponent } from './employee-detail-dialog.component';

@Component({
  selector: 'app-employee-compoff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    DatePipe
  ],
  templateUrl: './employee-compoff.component.html',
  styleUrl: './employee-compoff.component.scss'
})
export class EmployeeCompoffComponent implements OnInit, OnDestroy {
  private readonly holidayService = inject(HolidayService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  loading: boolean = true;
  error: string | null = null;
  selectedYear: any = new Date().getFullYear();
  yearList: (number | string)[] = [];

  allEmployees: any[] = [];
  filteredEmployees: any[] = [];

  searchText: string = '';
  onlyWithCompoff: boolean = true;

  // Stats
  totalEmployeesWithCompoff: number = 0;
  totalAllottedDays: number = 0;
  totalAvailedDays: number = 0;
  totalBalanceDays: number = 0;
  totalHolidaysCount: number = 0;

  private sub!: Subscription;

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    for (let y = currentYear; y >= currentYear - 5; y--) {
      this.yearList.push(y);
    }
    this.yearList.push('all');

    this.fetchData();
  }

  fetchData(): void {
    this.loading = true;
    this.error = null;
    this.sub = this.holidayService.getEmployeeCompoffDetails(this.selectedYear).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.allEmployees = res.employees || [];
        this.totalHolidaysCount = res.totalHolidaysWithCompOff || 0;
        this.applyFilter();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Failed to load employee comp-off details';
      }
    });
  }

  onYearChange(): void {
    this.fetchData();
  }

  applyFilter(): void {
    let list = this.allEmployees;

    // Filter by comp-off presence
    if (this.onlyWithCompoff) {
      list = list.filter(emp => emp.hasCompoff || emp.totalAllotted > 0 || emp.leaveBalance > 0);
    }

    // Filter by search text
    if (this.searchText && this.searchText.trim() !== '') {
      const q = this.searchText.toLowerCase().trim();
      list = list.filter(emp =>
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.empNo && emp.empNo.toLowerCase().includes(q)) ||
        (emp.email && emp.email.toLowerCase().includes(q))
      );
    }

    this.filteredEmployees = list;
    this.calculateStats();
  }

  calculateStats(): void {
    const activeCompoffEmployees = this.allEmployees.filter(e => e.hasCompoff || e.totalAllotted > 0 || e.leaveBalance > 0);
    this.totalEmployeesWithCompoff = activeCompoffEmployees.length;
    this.totalAllottedDays = activeCompoffEmployees.reduce((sum, e) => sum + (Number(e.totalAllotted) || 0), 0);
    this.totalAvailedDays = activeCompoffEmployees.reduce((sum, e) => sum + (Number(e.takenLeaves) || 0), 0);
    this.totalBalanceDays = activeCompoffEmployees.reduce((sum, e) => sum + (Number(e.leaveBalance) || 0), 0);
  }

  viewEmployeeDetails(employee: any): void {
    this.dialog.open(EmployeeCompoffDetailDialogComponent, {
      data: { employee },
      width: '650px'
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/login/holiday');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

