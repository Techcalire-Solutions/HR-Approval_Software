/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { NewLeaveService } from '@services/new-leave.service';

@Component({
  selector: 'app-leave-reports',
  standalone: true,
  imports: [ MatPaginatorModule, MatSelectModule,
    CommonModule, // Required for *ngFor and *ngIf
    FormsModule, // Add this
  ],
  templateUrl: './leave-reports.component.html',
  styleUrl: './leave-reports.component.scss',
})
export class LeaveReportsComponent {
  employees: any[] = [];
  selectedYear: number = new Date().getFullYear(); // Default to the current year
  years: number[] = []; 
  leaveService = inject(NewLeaveService);

  ngOnInit(): void {
    this.generateYearOptions(); 
    this.getReport();
  }
  generateYearOptions(): void {
    const currentYear = new Date().getFullYear();
    this.selectedYear = currentYear;
    const startYear = currentYear - 5; // Generate a range of years, e.g., from 10 years ago
    for (let year = startYear; year <= currentYear; year++) {
      this.years.push(year);
    }
  }
  getReport(): void {
    this.leaveService.getReport(this.selectedYear, this.currentPage, this.pageSize, this.searchText).subscribe((res) => {
      console.log(res);
      
      this.employees = res.result;
      this.totalItems = res.total
    });
  }

  apiUrl ='https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  public userImage = 'img/users/avatar.png';
  getMonthName(index: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[index];
  }

  getBackgroundImage(employee: any): string {
    if (employee.url) {
        return `url(${employee.apiUrl}${employee.url})`;
    } else {
        return `url(${employee.defaultImage})`;
    }
  }

  currentPage: number = 1;
  pageSize: number = 3; 
  totalItems: number = 0;
  public onPageChanged(event: any){
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    console.log(this.currentPage, this.pageSize);
    
    this.getReport()
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getReport()
  }

  selectedMonth: number | null = null;
  onYearChange(value: any){
    this.selectedYear = value;
    this.getReport()
  }
}
