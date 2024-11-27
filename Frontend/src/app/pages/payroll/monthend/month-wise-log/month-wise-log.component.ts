/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { PayrollService } from '@services/payroll.service';

@Component({
  selector: 'app-month-wise-log',
  standalone: true,
  imports: [MatPaginatorModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule],
  templateUrl: './month-wise-log.component.html',
  styleUrl: './month-wise-log.component.scss'
})
export class MonthWiseLogComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    
  }
  ngOnInit(): void {
    this.getMonthlyLog();
  }

  payrollService = inject(PayrollService);
  logs: any[] = [];
  getMonthlyLog(){
    this.payrollService.getMonthlyPayroll(this.searchText, this.currentPage, this.pageSize).subscribe(data =>{
      this.logs = data.items
      this.totalItems = data.count;
    });
  }

  private router = inject(Router);
  openPayroll(id: number){
    this.router.navigateByUrl('login/payroll/month-end/payslip/open/'+ id)
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim();
    this.getMonthlyLog()
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getMonthlyLog();
  }

}
