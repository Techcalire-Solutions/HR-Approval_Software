/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { PayrollService } from '@services/payroll.service';

@Component({
  selector: 'app-month-wise-log',
  standalone: true,
  imports: [MatPaginatorModule, MatButtonToggleModule, MatFormFieldModule],
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
    this.payrollService.getMonthlyPayroll().subscribe(data =>{
      this.logs = data;
      console.log(data);
      
    });
  }

  private router = inject(Router);
  openPayroll(id: number){
    this.router.navigateByUrl('login/payroll/month-end/payslip/open/'+ id)
  }

}
