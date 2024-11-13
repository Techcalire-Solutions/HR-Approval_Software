import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AdvanceSalary } from '../../../../common/interfaces/payRoll/advanceSalary';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-view-log',
  standalone: true,
  imports: [MatButtonToggleModule, MatIconModule, CommonModule, MatFormFieldModule],
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

  search(event: Event){
    console.log(event);
    
  }

  ngOnDestroy(): void {
    this.salarySub?.unsubscribe();
  }
  
}
