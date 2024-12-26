/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PayrollService } from '@services/payroll.service';
import { Payroll } from '../../../common/interfaces/payRoll/payroll';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdvanceSalary } from '../../../common/interfaces/payRoll/advanceSalary';
import * as XLSX from 'xlsx'; 
import { MatButtonModule } from '@angular/material/button';
import { UpdateSendmailComponent } from './update-sendmail/update-sendmail.component';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LeaveService } from '@services/leave.service';

@Component({
  selector: 'app-monthend',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatFormFieldModule,
    MatSelectModule
  ],
  templateUrl: './monthend.component.html',
  styleUrl: './monthend.component.scss'
})
export class MonthendComponent implements OnInit, OnDestroy{
  daysInMonth: number;
  currentYear: number;
  changeSub!: Subscription;
  ngOnInit(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    this.month = monthNames[currentMonth-1];
    this.currentYear = currentDate.getFullYear();
    this.daysInMonth = new Date(this.currentYear, currentMonth, 0).getDate();

    this.payrollForm.valueChanges.subscribe(() => {
      const payrollArray = this.payrollForm.get('payrolls') as FormArray;

      payrollArray.controls.forEach((control, index) => {
          this.changeSub = control.valueChanges.subscribe(() => {
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
    const hra: number = Number(payrollGroup.get('hra')?.value || 0);
    const conveyanceAllowance: number = Number(payrollGroup.get('conveyanceAllowance')?.value || 0);
    const lta: number = Number(payrollGroup.get('lta')?.value || 0);
    const specialAllowance: number = Number(payrollGroup.get('specialAllowance')?.value || 0);

    const ot: number = Number(payrollGroup.get('ot')?.value || 0);
    const incentive: number = Number(payrollGroup.get('incentive')?.value || 0);
    const payOut: number = Number(payrollGroup.get('payOut')?.value || 0);
    const pf: number = Number(payrollGroup.get('pfDeduction')?.value || 0);
    const insurance: number = Number(payrollGroup.get('esi')?.value || 0);
    const tds: number = Number(payrollGroup.get('tds')?.value || 0);
    const leaveDays: number = Number(payrollGroup.get('leaveDays')?.value || 0);
    const advanceAmount: number = Number(payrollGroup.get('advanceAmount')?.value || 0);
    const incentiveDeduction: number = Number(payrollGroup.get('incentiveDeduction')?.value || 0);
    const leaveBal: number = Number(payrollGroup.get('leaveEncashment')?.value || 0);

    const gross = basic + hra + conveyanceAllowance + lta + specialAllowance;
    
    const perDayEncash = gross/30;
    const leaveEncash = perDayEncash * leaveBal

    const roundedGross = Math.round(gross); 
    payrollGroup.get('perDay')?.setValue((roundedGross / this.daysInMonth).toFixed(2), { emitEvent: false });
    payrollGroup.get('daysInMonth')?.setValue((this.daysInMonth), { emitEvent: false });

    const deduction = pf + insurance + tds + advanceAmount + incentiveDeduction;
    const grossTotal = Math.round(gross + ot + incentive + payOut + leaveEncash - deduction); 
    const perDaySalary = gross / this.daysInMonth;
    const leaveDeduction = perDaySalary * leaveDays

    payrollGroup.get('leaveDeduction')?.setValue(leaveDeduction, { emitEvent: false });
    const totalToPay = Number((grossTotal - leaveDeduction).toFixed(2))
    payrollGroup.get('toPay')?.setValue(totalToPay, { emitEvent: false });
  }


  removeData(index: number): void {
    this.doc().removeAt(index);
  }

  newDoc(initialValue?: any): FormGroup {
    const payedForValue = `${this.month} ${this.currentYear}`;
    return this.fb.group({
      id: [initialValue ? initialValue.id : '', Validators.required],
      userId: [initialValue ? initialValue.userId : '', Validators.required],
      employeeId: [initialValue ? initialValue.user?.empNo : '', Validators.required],
      perDay: [],
      userName: [initialValue ? initialValue.user?.name : '', Validators.required],
      basic: [initialValue ? initialValue.basic : 0, Validators.required],
      hra: [initialValue ? initialValue.hra : 0, Validators.required],
      conveyanceAllowance: [initialValue ? initialValue.conveyanceAllowance : 0, Validators.required],
      lta: [initialValue ? initialValue.lta : 0, Validators.required],
      specialAllowance: [initialValue ? initialValue.specialAllowance : 0, Validators.required],
      ot: [initialValue ? initialValue.ot : 0,],
      incentive: [initialValue ? initialValue.incentive : 0,],
      payOut: [initialValue ? initialValue.payOut : 0,],
      pfDeduction: [initialValue ? initialValue.pfDeduction : 0, Validators.required],
      esi: [initialValue ? initialValue.esi : 0, Validators.required],
      tds: [initialValue ? initialValue.tds : 0, Validators.required],
      advanceAmount: [initialValue ? initialValue.advanceAmount : 0],
      leaveDays: [initialValue ? initialValue.leaveDays : 0],
      leaveDeduction: [0],
      incentiveDeduction: [initialValue ? initialValue.incentiveDeduction : 0,],
      toPay: [{ value: 0, disabled: true }],
      payedFor: [payedForValue],
      daysInMonth : [ initialValue ? initialValue.daysInMonth : 0],
      leaveEncashment : [initialValue ? initialValue.leaveEncashment : 0]
    });
  }

  payrollSub!: Subscription;
  payrollService = inject(PayrollService);
  payrolls: Payroll[] = [];
  updateStatus: boolean = false;
  paySub!: Subscription;
  advanceSUb!: Subscription;
  isRejected: boolean = false;
  isLocked: boolean = false;
  approval: boolean = false;
  saved: boolean = false;
  private leaveService = inject(LeaveService);
  private enchashSub: Subscription;
  getPayroll() {
    this.payrolls = [];
    const payedForValue = `${this.month} ${this.currentYear}`;
    const isDecember = this.month.toLowerCase() === 'december';

    this.paySub = this.payrollService.getMonthlyPayrollByPayedFor(payedForValue).subscribe(payroll =>{
      if(payroll.length === 0){
        this.payrollSub = this.payrollService.getPayroll().subscribe((payroll) => {
          this.payrolls = payroll;

          this.enchashSub = this.leaveService.getUserLeaveForEncash().subscribe(leaveBalances => {
            this.payrolls.forEach((payrollItem: any) => {
              const userId = payrollItem.userId;
  
              // Attach leave data to payroll item
              const leaveData = leaveBalances.find(leave => leave.userId === userId);
              if (leaveData) {
                payrollItem.leaveEncashment = isDecember ? leaveData.totalLeave : 0; 
                // payrollItem.casualLeave = leaveData.casualLeave || 0;
                // payrollItem.combOff = leaveData.combOff || 0;
              } else {
                payrollItem.leaveEncashment = 0;
                // payrollItem.casualLeave = 0;
                // payrollItem.combOff = 0;
              }

              this.advanceSUb = this.payrollService.getAdvanceSalaryByUserId(userId).subscribe((advanceSalary: AdvanceSalary) => {
                if(advanceSalary){
                  payrollItem.advanceAmount = advanceSalary.monthlyPay;
                }else{
                  payrollItem.advanceAmount = 0;
                }
  
                this.addDoc(payrollItem);
              });
            })
          })
        });
      }else{
        // this.updateStatus = true;
        this.payrolls = payroll;
        this.payrolls.forEach((payrollItem: any) => {
          if (payrollItem.status === 'SendforApproval') {
            this.approval = true;
          }else if (payrollItem.status === 'Approved') {
            this.isApproved = true;
            this.isRejected = false;
          } else if (payrollItem.status === 'Rejected') {
            this.isApproved = false;
            this.isRejected = true;
          } else if (payrollItem.status === 'Locked') {
            this.isLocked = true;
          }else{
            this.updateStatus = true;
          }
          this.addDoc(payrollItem);
        });
      }
    });
  }

  get payrollControls(): FormArray {
    return this.payrollForm.get('payrolls') as FormArray;
  }

  isSave: boolean = false;
  private snackBar = inject(MatSnackBar);
  submit!: Subscription;
  savePayroll(){
    this.isLoading = true;
    this.isSave = true;
    if(this.updateStatus || this.isRejected || this.isApproved){
      this.submit = this.payrollService.updateMonthlyPayroll(this.payrollForm.getRawValue()).subscribe(() => {
        this.isLoading = false;
        this.approval = false;
        this.isApproved = false;
        this.isRejected = false;
        this.snackBar.open('Payroll is updated successfully...', '', { duration: 3000 });
        this.clearAllRows()
        this.getPayroll()
      });
    }else{
      this.submit = this.payrollService.monthlyPayroll(this.payrollForm.getRawValue()).subscribe(() => {
        this.isLoading = false
        this.snackBar.open('Payroll is saved successfully...', '', { duration: 3000 });
        this.getPayroll()
        this.clearAllRows();
      })
    }
  }

  clearAllRows() {
    const docFormArray = this.doc();
    if (docFormArray instanceof FormArray) {
      docFormArray.clear(); // Removes all the controls in the FormArray
    }
  }

  isApproved: boolean = false;
  private dialog = inject(MatDialog);
  isLoading: boolean = false;
  mailSendSub!: Subscription;
  dialogSub!: Subscription;
  downloadExcel() {
    const payrollData = (this.payrollForm.get('payrolls') as FormArray).getRawValue();
    const formattedData = payrollData.map((row: any, index: number) => ({
      'S.No': index + 1,
      'Employee Name': row.userName,
      'Employee ID': row.employeeId,
      'Per Day': row.perDay,
      'Basic (₹)': row.basic,
      'HRA (₹)': row.hra,
      'Conveyance Allowance (₹)': row.conveyanceAllowance,
      'LTA (₹)': row.lta,
      'Special Allowance (₹)': row.specialAllowance,
      'OT (₹)': row.ot,
      'Incentive (₹)': row.incentive,
      'PayOut (₹)': row.payOut,
      'PF Deduction (₹)': row.pfDeduction,
      'ESI (₹)': row.esi,
      'TDS (₹)': row.tds,
      'Advance Amount (₹)': row.advanceAmount,
      'Leave Days': row.leaveDays,
      'Incentive Deduction (₹)': row.incentiveDeduction,
      'Net Salary (To Pay ₹)': row.toPay
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // Convert the buffer to a Blob
    const fileBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const dialogRef = this.dialog.open(UpdateSendmailComponent, {
      width: '400px',
      data: {}
    });
  
    this.dialogSub = dialogRef.afterClosed().subscribe((email) => {
      if (email) {
        if(!this.validateEmail(email)){
          return alert('Invalid email address. Please enter a valid email.')
        }
        this.isLoading = true;
        const formData = new FormData();
        formData.append('file', fileBlob, `Payroll_${this.month}_${this.daysInMonth}.xlsx`);
        formData.append('email', email);
        formData.append('month', `${this.month} ${this.currentYear}`);
        formData.append('payrollData', JSON.stringify(payrollData));
  
        this.mailSendSub = this.payrollService.sendEmailWithExcel(formData).subscribe(() => {
          this.isLoading = false;
          
          this.snackBar.open(`Email sent successfully to ${email}!...`, '', { duration: 3000 });
          this.getPayroll();
          this.clearAllRows();
        });
      }
    });
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  updateSub!: Subscription;
  lockData(){
    this.isApproved = false;
    this.isLoading = true;
    const data = {
      payrollData: this.payrolls,
      status: 'Locked'
    }
    this.updateSub = this.payrollService.updateMPStatus(data).subscribe(() => {
      this.isLoading = false;
      this.snackBar.open(`Payslip has been successfully generated and emailed!...`, '', { duration: 3000 });         
      this.getPayroll();
      this.clearAllRows();
    });
  }

  downloadExcelOnly() {
    const payrollData = (this.payrollForm.get('payrolls') as FormArray).getRawValue();
    const formattedData = payrollData.map((row: any, index: number) => ({
      'S.No': index + 1,
      'Employee Name': row.userName,
      'Employee ID': row.employeeId,
      'Per Day': row.perDay,
      'Basic (₹)': row.basic,
      'HRA (₹)': row.hra,
      'Conveyance Allowance (₹)': row.conveyanceAllowance,
      'LTA (₹)': row.lta,
      'Special Allowance (₹)': row.specialAllowance,
      'OT (₹)': row.ot,
      'Incentive (₹)': row.incentive,
      'PayOut (₹)': row.payOut,
      'PF Deduction (₹)': row.pfDeduction,
      'ESI (₹)': row.esi,
      'TDS (₹)': row.tds,
      'Advance Amount (₹)': row.advanceAmount,
      'Leave Days': row.leaveDays,
      'Incentive Deduction (₹)': row.incentiveDeduction,
      'Net Salary (To Pay ₹)': row.toPay
    }));
  
    // Create a worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll');
  
    // Write the workbook to a buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
    // Convert the buffer to a Blob
    const fileBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  
    // Create a download link
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(fileBlob);
    link.href = url;
    link.download = `Payroll_${this.month}_${this.daysInMonth}.xlsx`;
    link.click();
  
    // Clean up
    window.URL.revokeObjectURL(url);
  }
  
  months = [
    { name: 'January', value: 0 },
    { name: 'February', value: 1 },
    { name: 'March', value: 2 },
    { name: 'April', value: 3 },
    { name: 'May', value: 4 },
    { name: 'June', value: 5 },
    { name: 'July', value: 6 },
    { name: 'August', value: 7 },
    { name: 'September', value: 8 },
    { name: 'October', value: 9 },
    { name: 'November', value: 10 },
    { name: 'December', value: 11 },
  ];

  onMonthYearChange(value: number): void {
    this.calculateIfPreviousMonth(value);
  }

  isPreviousMonth: boolean = false;
  calculateIfPreviousMonth(value: number): void {
    const currentMonth = new Date().getMonth();
    const selectedMonth: any = value;
    this.isPreviousMonth = (selectedMonth < currentMonth);
    this.month = this.months[selectedMonth].name;
    this.daysInMonth = new Date(this.currentYear, selectedMonth+1, 0).getDate();
    this.clearAllRows()
    this.isLocked = false;
    this.updateStatus = false;
    this.getPayroll()
  }
  

  ngOnDestroy(): void {
    this.advanceSUb?.unsubscribe();
    this.paySub?.unsubscribe();
    this.payrollSub?.unsubscribe();
    this.updateSub?.unsubscribe();
    this.mailSendSub?.unsubscribe();
    this.submit?.unsubscribe();
    this.advanceSUb?.unsubscribe();
    this.paySub?.unsubscribe();
    this.payrollSub?.unsubscribe();
    this.changeSub?.unsubscribe();
    this.enchashSub?.unsubscribe();
  }

}
