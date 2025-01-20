/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '@services/leave.service';

@Component({
  selector: 'app-leave-reports',
  standalone: true,
  imports: [
    CommonModule, // Required for *ngFor and *ngIf
    FormsModule, // Add this
  ],
  templateUrl: './leave-reports.component.html',
  styleUrl: './leave-reports.component.scss',
})
export class LeaveReportsComponent {
  employees: any[] = [];
  selectedYear: number = new Date().getFullYear(); // Default to the current year
  years: number[] = []; // Array to store the list of years

  leaveService = inject(LeaveService);

  ngOnInit(): void {
    this.generateYearOptions(); 
  }
  generateYearOptions(): void {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // Generate a range of years, e.g., from 10 years ago
    for (let year = startYear; year <= currentYear; year++) {
      this.years.push(year);
    }
  }
  getReport(): void {
    this.leaveService.getReport(this.selectedYear).subscribe((res) => {
      this.employees = res;
    });
  }
}
