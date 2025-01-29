/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';
import { MonthlyPayroll } from '../../../common/interfaces/payRoll/monthlyPayroll';

@Component({
  selector: 'app-year-to-date',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './year-to-date.component.html',
  styleUrl: './year-to-date.component.scss'
})
export class YearToDateComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.mpSub?.unsubscribe();
  }
  ngOnInit(): void {
    this.getMonthlyPayroll();
  }
  isLoading: boolean = false;
  filters = { startDate: '', endDate: '' };
  errorMessage = '';
  private fb = inject(FormBuilder);

  ytdForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  applyFilters(): void {
    this.getMonthlyPayroll();
  }

  private payrollService = inject(PayrollService);
  mpSub!: Subscription;
  mp: MonthlyPayroll[] = [];
  getMonthlyPayroll(){
    const from = this.ytdForm.get('startDate')?.value;
    const to = this.ytdForm.get('endDate')?.value;
    this.mpSub = this.payrollService.getMonthlyPayrollForYTD(from, to).subscribe(data => {
      this.mp = data.map((item: any) => ({
        ...item,
        toPay: Number(item.toPay) // Ensure toPay is a number
      }));
      
      this.calculateTotal();
    });
  }

  totalAmount: number = 0;
  calculateTotal() {
    this.totalAmount = this.mp.reduce((total, row) => total + row.toPay, 0);
  }
  
}
