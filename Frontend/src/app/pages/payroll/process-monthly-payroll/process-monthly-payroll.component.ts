import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';  // Import CommonModule
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { BrowserModule } from '@angular/platform-browser';
import { Payroll } from '../../../common/interfaces/payroll';
import { PayrollService } from '@services/payroll.service';

// Mock employee data from getUsers() service
interface Employee {
  employeeName: string;
  code: string;
  lopCount: number;
  lopAmount: number;
  basic: number;
  hra: number;
  ca: number;
  lta: number;
  specialAllowance: number;
  pf: number;
  insurance: number;
  gratuity: number;
  monthlyTotal?: number;
}

@Component({
  selector: 'app-process-monthly-payroll',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatSelectModule,
    CommonModule
  ],
  templateUrl: './process-monthly-payroll.component.html',
  styleUrls: ['./process-monthly-payroll.component.scss'],
})
export class ProcessMonthlyPayrollComponent implements OnInit {
  employees: Employee[] = [];
  payrollService=inject(PayrollService)
  ngOnInit() {
    this.getPayroll();

    this.employees = [
      {
        employeeName: 'John Doe',
        code: 'E001',
        lopCount: 0,
        lopAmount: 0,
        basic: 50000,
        hra: 15000,
        ca: 5000,
        lta: 10000,
        specialAllowance: 7000,
        pf: 6000,
        insurance: 2000,
        gratuity: 3000,
      },
      {
        employeeName: 'John Doe',
        code: 'E001',
        lopCount: 0,
        lopAmount: 0,
        basic: 50000,
        hra: 15000,
        ca: 5000,
        lta: 10000,
        specialAllowance: 7000,
        pf: 6000,
        insurance: 2000,
        gratuity: 3000,
      },
      // Add more employees as needed
    ];
  }
  public allEmployeesPayroll: Payroll[] | null;
  public getPayroll(): void {
    this.payrollService.getPayroll().subscribe((advanceSalary: any) =>{
      this.allEmployeesPayroll = advanceSalary
      console.log('this.allEmployeesPayroll',this.allEmployeesPayroll);
      
    });
  }
  calculateTotal(employee: Employee) {
    employee.monthlyTotal = 
      employee.basic + employee.hra + employee.ca + employee.lta +
      employee.specialAllowance - (employee.lopCount * employee.lopAmount) -
      employee.pf - employee.insurance - employee.gratuity;
  }

  onCodeChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement; // Cast to HTMLInputElement
    employee.code = input.value; // Update employee's code
  }

  onLopCountChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.lopCount = Number(input.value); // Convert to number
    this.calculateTotal(employee); // Recalculate total
  }

  onLopAmountChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.lopAmount = Number(input.value);
    this.calculateTotal(employee);
  }

  onBasicChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.basic = Number(input.value);
    this.calculateTotal(employee);
  }

  onHraChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.hra = Number(input.value);
    this.calculateTotal(employee);
  }

  onCaChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.ca = Number(input.value);
    this.calculateTotal(employee);
  }

  onLtaChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.lta = Number(input.value);
    this.calculateTotal(employee);
  }

  onSpecialAllowanceChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.specialAllowance = Number(input.value);
    this.calculateTotal(employee);
  }

  onPfChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.pf = Number(input.value);
    this.calculateTotal(employee);
  }

  onInsuranceChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.insurance = Number(input.value);
    this.calculateTotal(employee);
  }

  onGratuityChange(event: Event, employee: Employee) {
    const input = event.target as HTMLInputElement;
    employee.gratuity = Number(input.value);
    this.calculateTotal(employee);
  }
  saveData() {
    // Implement your save logic here
    console.log("Saving employee data:", this.employees);
    // For example, send the employees array to a backend service to save the data
  }
}