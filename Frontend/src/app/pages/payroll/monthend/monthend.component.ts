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
import * as ExcelJS from 'exceljs';
import saveAs from 'file-saver';
import { NewLeaveService } from '@services/new-leave.service';

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
  years: number[] = [];
  ngOnInit(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    this.month = currentMonth === 0
      ? monthNames[11]
      : monthNames[currentMonth - 1];
      this.selectedMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    this.currentYear = currentMonth === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    this.daysInMonth = new Date(this.currentYear, currentMonth, 0).getDate();

    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2020; year--) {
      this.years.push(year);
    }

    this.payrollForm.valueChanges.subscribe(() => {
      const payrollArray = this.payrollForm.get('payrolls') as FormArray;

      payrollArray.controls.forEach((control, index) => {
          this.changeSub = control.valueChanges.subscribe(() => {
            this.calculateTotalSalary(index);
          });
      });
    });

    this.getPayroll();
    this.getLeaveDays();
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
    this.calculateTotalSalary(index);
  }

  ldSub!: Subscription;
  leaveDaysData: any[] = [];
  getLeaveDays() {
    // Convert month name to month number (e.g., January -> 0, February -> 1, etc.)
    const monthNumber = new Date(`${this.month} 1, ${this.currentYear}`).getMonth();
    // Generate start date
    const startDate = `${this.currentYear}-${String(monthNumber + 1).padStart(2, '0')}-01`; // e.g., 2025-01-01
    
    // Generate end date (last day of the month) with local timezone adjustment
    const endDate = new Date(this.currentYear, monthNumber + 1, 0); // Last day of the month
    const formattedEndDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  
  
    // Call the API with dynamic dates
    this.ldSub = this.leaveService.getMonthlyLeaveDays(startDate, formattedEndDate).subscribe(leave => {
      this.leaveDaysData = leave;
    });
  }
  

  month: string;
  calculateTotalSalary(index: number): void {
    const payrollGroup = this.doc().at(index) as FormGroup;

    const parseValue = (field: string): number => {
        const value = payrollGroup.get(field)?.value || '0';
        return Number(value.toString().replace(/,/g, '')); // Remove commas before conversion
    };

    const basic = parseValue('basic');
    const hra = parseValue('hra');
    const conveyanceAllowance = parseValue('conveyanceAllowance');
    const lta = parseValue('lta');
    const specialAllowance = parseValue('specialAllowance');
    const ot = parseValue('ot');
    const incentive = parseValue('incentive');
    const payOut = parseValue('payOut');
    const pf = parseValue('pfDeduction');
    const insurance = parseValue('esi');
    const tds = parseValue('tds');
    const leaveDays = parseValue('leaveDays');
    const advanceAmount = parseValue('advanceAmount');
    const incentiveDeduction = parseValue('incentiveDeduction');
    const leaveBal = parseValue('leaveEncashment');

    const gross = basic + hra + conveyanceAllowance + lta + specialAllowance;

    const perDayEncash = gross / 30;
    const leaveEncash = (perDayEncash * leaveBal).toFixed(2);
    payrollGroup.get('leaveEncashmentAmount')?.setValue(leaveEncash, { emitEvent: false });

    const roundedGross = Math.round(gross);
    payrollGroup.get('perDay')?.setValue((roundedGross / this.daysInMonth).toFixed(2), { emitEvent: false });
    payrollGroup.get('daysInMonth')?.setValue(this.daysInMonth, { emitEvent: false });

    const deduction = pf + insurance + tds + advanceAmount + incentiveDeduction;
    const grossTotal = Math.round(gross + ot + incentive + payOut + Number(leaveEncash) - deduction);
    const perDaySalary = gross / this.daysInMonth;
    const leaveDeduction = perDaySalary * leaveDays;

    payrollGroup.get('leaveDeduction')?.setValue(leaveDeduction, { emitEvent: false });

    const totalToPay = Number((grossTotal - leaveDeduction).toFixed(2));

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
      leaveEncashment : [initialValue ? initialValue.leaveEncashment : 0],
      cl : [initialValue ? initialValue.casualLeave : 0],
      combOff : [initialValue ? initialValue.combOff : 0],
      leaveEncashmentAmount : []
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
  private leaveService = inject(NewLeaveService);
  private enchashSub: Subscription;
  getPayroll() {
    this.payrolls = [];
    const payedForValue = `${this.month} ${this.currentYear}`;
    const isDecember = this.month.toLowerCase() === 'december';

    this.paySub = this.payrollService.getMonthlyPayrollByPayedFor(payedForValue).subscribe(payroll =>{
      if(payroll.length === 0){
        this.payrollSub = this.payrollService.getPayroll().subscribe((payroll) => {
          this.payrolls = payroll;

          this.enchashSub = this.leaveService.getUserLeaveForEncash(this.currentYear).subscribe(leaveBalances => {
            this.payrolls.forEach((payrollItem: any) => {
              const userId = payrollItem.userId;
              const leaveDays = this.leaveDaysData.find(leave => leave.userId === userId);
              payrollItem.leaveDays = leaveDays ? leaveDays.totalLeaveDays : 0;

              if(isDecember){
                const leaveData = leaveBalances.find(leave => leave.userId === userId);
                if (leaveData) {
                  payrollItem.leaveEncashment = leaveData.totalLeave; 
                  payrollItem.casualLeave = leaveData.casualLeave;
                  payrollItem.combOff = leaveData.combOff;
                } else {
                  payrollItem.leaveEncashment = 0;
                  payrollItem.casualLeave = 0;
                  payrollItem.combOff = 0;
                }
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
        this.updateStatus = true;
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
      'CA(₹)': row.conveyanceAllowance,
      'LTA': row.lta,
      'SA': row.specialAllowance,
      'OT': row.ot,
      'Incentive': row.incentive,
      'PayOut': row.payOut,
      'LeaveBalance': row.leaveDays,
      'PF': row.pfDeduction,
      'ESI': row.esi,
      'TDS': row.tds,
      'Advance': row.advanceAmount,
      'LeaveDays': row.leaveDays,
      'Incentive Deduction': row.incentiveDeduction,
      'Net Salary (To Pay ₹)': row.toPay,
    }));
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll')
  
    // Header Row 1
    worksheet.getRow(1).values = [
      'S.No', 'Employee Name', 'Employee ID', 'Per Day',
      'Earnings', '', '', '', '', '','', '', '',
      'Deductions', '', '', '', '','',
      'Net Salary'
    ];
  
    // Header Row 2
    worksheet.getRow(2).values = [
      '', '', '', '',
      'Basic (₹)', 'HRA (₹)', 'CA(₹)', 'LTA', 'SA', 'OT','Incentive', 'Payout', 'LeaveBalance',
      'PF', 'ESI', 'TDS', 'Advance', 'LeaveDays', 'Incentive',
      'To Pay ₹'
    ];

        // Merged Header Rows for Groups
    worksheet.mergeCells('A1:A2'); // S.No
    worksheet.mergeCells('B1:B2'); // Employee Name
    worksheet.mergeCells('C1:C2'); // Employee ID
    worksheet.mergeCells('D1:D2'); // Per Day
    worksheet.mergeCells('E1:M1'); // Earnings Group Header
    worksheet.mergeCells('N1:S1'); // Deductions Group Header
    // worksheet.mergeCells('S1:S2'); // Net Salary

    // Header Styling for Row 1
    worksheet.getRow(1).eachCell((cell, colIndex) => {
      if (colIndex >= 5 && colIndex <= 10) {
        // Apply styles for "Earnings"
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '92D050' }, // Green background
        };
      } else if (colIndex >= 11 && colIndex <= 15) {
        // Apply styles for "Deductions"
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0000' }, // Red background
        };
      } else {
        // Default style for other headers
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0070C0' }, // Blue background
        };
      }
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  
    // Header Styling for Row 2
    worksheet.getRow(2).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '92D050' }, // Green for subheaders in row 2
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  
    // Add Data Rows
    formattedData.forEach((data, index) => {
      const row = worksheet.addRow(Object.values(data));
      row.eachCell((cell: any) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  
    // Adjust Column Widths
    worksheet.columns.forEach((column: any) => {
      column.width = 15; // Adjust column widths for readability
    });
  
    // Save the Excel File
    workbook.xlsx.writeBuffer().then((buffer: any) => {
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      saveAs(blob, `Payroll_${this.month}_${this.daysInMonth}.xlsx`);
    });
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

  selectedMonth: number | null = null;
  onYearChange(value: number){
    this.currentYear = value;
    this.selectedMonth = null;
  }

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
    this.getLeaveDays();
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
