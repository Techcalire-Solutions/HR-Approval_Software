import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PayrollService } from '@services/payroll.service';
import { CommonModule } from '@angular/common';
import { MonthlyPayroll } from '../../../../common/interfaces/payRoll/monthlyPayroll';

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payslip.component.html',
  styleUrl: './payslip.component.scss'
})
export class PayslipComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
  }
  ngOnInit(): void {
    this.getPaySlip()
  }

  private payroleService = inject(PayrollService);
  private route = inject(ActivatedRoute);
  payroll: MonthlyPayroll;
  getPaySlip(){
    this.payroleService.getMonthlyPayrollById(this.route.snapshot.params['id']).subscribe(payroll => {
      this.payroll = payroll;
      console.log(payroll);
      
    })
  }

}
