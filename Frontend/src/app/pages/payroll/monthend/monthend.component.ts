/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PayrollService } from '@services/payroll.service';
import { Payroll } from '../../../common/interfaces/payRoll/payroll';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdvanceSalary } from '../../../common/interfaces/payRoll/advanceSalary';

@Component({
  selector: 'app-monthend',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './monthend.component.html',
  styleUrl: './monthend.component.scss'
})
export class MonthendComponent implements OnInit, OnDestroy{
  daysInMonth: number;
  currentYear: number;

  ngOnInit(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); 

    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ]
    this.month = monthNames[currentMonth-1];
    this.currentYear = currentDate.getFullYear();
  
    this.daysInMonth = new Date(this.currentYear, currentMonth + 1, 0).getDate();

    this.payrollForm.valueChanges.subscribe(() => {
      const payrollArray = this.payrollForm.get('payrolls') as FormArray;
      
      payrollArray.controls.forEach((control, index) => {
          control.valueChanges.subscribe(() => {
            this.calculateTotalSalary(index);
          });
      });
    });
    
    this.getPayroll();
  }

  private cdr = inject(ChangeDetectorRef)          

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  private fb = inject(FormBuilder);
  payrollForm = this.fb.group({
    payrolls: this.fb.array([])
  });

  index!: number;
  doc(): FormArray {
    return this.payrollForm.get('payrolls') as FormArray;
  }

  addDoc(data?: Payroll): void {
    const newPayroll = this.newDoc(data);
    this.doc().push(newPayroll);

    const index = this.doc().length - 1;
    // newPayroll.valueChanges.subscribe(() => {
      this.calculateTotalSalary(index);
    // });

  }

  month: string;
  calculateTotalSalary(index: number): void {
    const payrollGroup = this.doc().at(index) as FormGroup;
  
    const basic: number = Number(payrollGroup.get('basic')?.value || 0);
    const hra: number = Number( payrollGroup.get('hra')?.value || 0);
    const conveyanceAllowance: number = Number( payrollGroup.get('conveyanceAllowance')?.value || 0);
    const lta: number = Number( payrollGroup.get('lta')?.value || 0 );
    const specialAllowance: number = Number( payrollGroup.get('specialAllowance')?.value || 0 );
    const pf : number = Number(payrollGroup.get('pf')?.value || 0);
    const insurance : number = Number(payrollGroup.get('insurance')?.value || 0);
    const gratuity : number = Number(payrollGroup.get('gratuity')?.value || 0);
    const leaveDays: number = Number( payrollGroup.get('leaveDays')?.value || 0);
    const advance: number = Number( payrollGroup.get('advance')?.value || 0);

    
    const grossTotal = (basic + hra + conveyanceAllowance + lta + specialAllowance) - (pf + insurance + gratuity + advance);
    
    const perDaySalary = basic / this.daysInMonth;
    const leaveDeduction = perDaySalary * leaveDays;
    const totalToPay = grossTotal - leaveDeduction;
    
    payrollGroup.get('toPay')?.setValue(totalToPay, { emitEvent: false });
  }

  removeData(index: number): void {
    this.doc().removeAt(index);
  }

  newDoc(initialValue?: any): FormGroup {
    const payedForValue = `${this.month} ${this.currentYear}`;
    return this.fb.group({
      userId: [initialValue ? initialValue.userId : '', Validators.required],
      userName: [initialValue ? initialValue.user.name : '', Validators.required],
      basic: [initialValue ? initialValue.basic : '', Validators.required],
      hra: [initialValue ? initialValue.hra : '', Validators.required],
      conveyanceAllowance: [initialValue ? initialValue.conveyanceAllowance : '', Validators.required],
      lta: [initialValue ? initialValue.lta : '', Validators.required],
      specialAllowance: [initialValue ? initialValue.specialAllowance : '', Validators.required],
      pf: [initialValue ? initialValue.pf : '', Validators.required],
      insurance: [initialValue ? initialValue.insurance : '', Validators.required],
      gratuity: [initialValue ? initialValue.gratuity : '', Validators.required],
      advanceAmount: [initialValue ? initialValue.advanceAmount : ''],
      leaveDays: [initialValue ? initialValue.leaveDays : ''],
      toPay: [{ value: 0, disabled: true }],
      payedFor: [payedForValue]
    });
  }

  payrollSub!: Subscription;
  payrollService = inject(PayrollService);
  payrolls: Payroll[] = [];
  updateStatus: boolean = false;
  getPayroll() {
    const payedForValue = `${this.month} ${this.currentYear}`;
    console.log(payedForValue);
    
    this.payrollService.getMonthlyPayrollByPayedFor(payedForValue).subscribe(payroll =>{
      console.log(payroll);
      if(payroll.length === 0){
        this.payrollSub = this.payrollService.getPayroll().subscribe((payroll) => {
          this.payrolls = payroll;
      
          this.payrolls.forEach((payrollItem: any) => {
            const userId = payrollItem.userId;
            
            this.payrollService.getAdvanceSalaryByUserId(userId).subscribe((advanceSalary: AdvanceSalary) => {
              if(advanceSalary){
                payrollItem.advanceAmount = advanceSalary.monthlyPay;
              }else{
                payrollItem.advanceAmount = 0;
              }
              this.addDoc(payrollItem);
            });
          });
        });
      }else{
        this.updateStatus = true;
        this.payrolls = payroll;
        console.log(this.payrolls);
        
        this.payrolls.forEach((payrollItem: any) => {
          this.addDoc(payrollItem);
        })
      }
    });
  }
  
  
  get payrollControls(): FormArray {
    return this.payrollForm.get('payrolls') as FormArray;
  }

  savePayroll(){
    console.log(this.payrollForm.getRawValue());
    
    if(this.updateStatus){
      this.payrollService.updateMonthlyPayroll(this.payrollForm.getRawValue()).subscribe(() => {
        this.getPayroll()
      })
    }else{
      this.payrollService.monthlyPayroll(this.payrollForm.getRawValue()).subscribe(() => {
        this.getPayroll()
      })
    }
  }
  
  ngOnDestroy(): void {
    
  }

}
