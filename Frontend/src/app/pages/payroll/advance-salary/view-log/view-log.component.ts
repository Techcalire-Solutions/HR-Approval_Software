import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';
import { AdvanceSalary } from '../../../../common/interfaces/advanceSalary';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-log',
  standalone: true,
  imports: [MatButtonToggleModule, MatIconModule, CommonModule],
  templateUrl: './view-log.component.html',
  styleUrl: './view-log.component.scss'
})
export class ViewLogComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.getAdvanceSalary()
  }

  private payrollService = inject(PayrollService);
  advanceSalaries: AdvanceSalary[] = [];
  salarySub!: Subscription;
  private getAdvanceSalary(): void {
    this.salarySub = this.payrollService.getAdvanceSalary().subscribe((advanceSalary: AdvanceSalary[]) =>{
      this.advanceSalaries = advanceSalary
      console.log(advanceSalary);
      
    });
  }

  ngOnDestroy(): void {
    this.salarySub?.unsubscribe();
  }
  
}
