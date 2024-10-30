import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';
import { Payroll } from '../../../common/interfaces/payroll';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-add-payroll',
  standalone: true,
  templateUrl: './add-payroll.component.html',
  imports: [ReactiveFormsModule, CommonModule],  // Include ReactiveFormsModule
  styleUrls: ['./add-payroll.component.scss']
})
export class AddPayrollComponent implements OnInit, OnDestroy {
  payrollForm: FormGroup;
  grossPay: number = 0;
  netPay: number = 0;
  totalDeductions: number = 0;
  isPayrollAvailable: boolean = false;

  userSub: Subscription;
  user: any;
  payroll: Payroll;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userService: UsersService,
    private payrollService: PayrollService
  ) {
    this.payrollForm = this.fb.group({
      basic: <any>[, Validators.required],
      yearbasicPay: <any>[, Validators.required],
      hra: <any>[, Validators.required],
      yearhra: <any>[, Validators.required],
      conveyanceAllowance: <any>[, Validators.required],
      yearconveyanceAllowance: <any>[, Validators.required],
      lta: <any>[],
      yearlta: <any>[],
      specialAllowance: <any>[],
      pf: <any>[, Validators.required],
      yearpf: <any>[],
      insurance: <any>[],
      gratuity: <any>[],
      yeargrossPay:  <any>[],
      grossPay: <any>[],
      yearGratuity:  <any>[],
      yearinsurance:  <any>[],
      netPay:  <any>[],
      yearnetPay:  <any>[],

  
  
  
  
      userName: [''],
      userRole: ['']
    });
  }

  ngOnInit(): void {
    this.getUserById();
    this.getPayrollDetailsByUserId();

    // Automatically calculate gross pay on value changes
    this.payrollForm.valueChanges.subscribe(() => {
      this.calculatePayroll();
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }

  getUserById() {
    this.userSub = this.userService.getUserById(this.route.snapshot.params['id']).subscribe((res) => {
      this.user = res;
      this.payrollForm.get('userName')?.setValue(this.user.name);
      this.payrollForm.get('userRole')?.setValue(this.user.role.roleName);
    });
  }

  getPayrollDetailsByUserId() {
    this.payrollService.getPayrollDetailsByUserId(this.route.snapshot.params['id']).subscribe({
      next: (res) => {
        this.isPayrollAvailable = !!res;
        if (res) {
          this.payroll = res;
          this.payrollForm.patchValue(res); // Populate the form with payroll data
        }
      },
      error: (err) => {
        console.error('Error fetching payroll:', err);
      }
    });
  }

  calculatePayroll() {
    this.payrollForm.get('basic')?.valueChanges.subscribe(() => {
      let bp: any = this.payrollForm.get('basic')?.value;
      let ybp = 12 * bp;
      this.payrollForm.patchValue({ yearbasicPay: ybp }, { emitEvent: false });
    });
  
    this.payrollForm.get('hra')?.valueChanges.subscribe(() => {
      let hr: any = this.payrollForm.get('hra')?.value;
      let yhr = 12 * hr;
      this.payrollForm.patchValue({ yearhra: yhr }, { emitEvent: false });
    });
  
    this.payrollForm.get('conveyanceAllowance')?.valueChanges.subscribe(() => {
      let conveyanceAllowance: any = this.payrollForm.get('conveyanceAllowance')?.value;
      let yca = 12 * conveyanceAllowance;
      this.payrollForm.patchValue({ yearconveyanceAllowance: yca }, { emitEvent: false });
    });
  
    this.payrollForm.get('lta')?.valueChanges.subscribe(() => {
      let lta: any = this.payrollForm.get('lta')?.value;
      let ylta = 12 * lta;
      this.payrollForm.patchValue({ yearlta: ylta }, { emitEvent: false });
    });
    this.payrollForm.get('gratuity')?.valueChanges.subscribe(() => {
      let gratuity: any = this.payrollForm.get('gratuity')?.value;
      let ygratuity = 12 * gratuity;
      this.payrollForm.patchValue({ yearGratuity: ygratuity }, { emitEvent: false });
    });
    this.payrollForm.get('insurance')?.valueChanges.subscribe(() => {
      let insurance: any = this.payrollForm.get('insurance')?.value;
      let yinsurance = 12 * insurance;
      this.payrollForm.patchValue({ yearinsurance: yinsurance }, { emitEvent: false });
    });
    this.payrollForm.get('pf')?.valueChanges.subscribe(() => {
      let pf: any = this.payrollForm.get('pf')?.value;
      let ypf = 12 * pf;
      this.payrollForm.patchValue({ yearpf: ypf }, { emitEvent: false });
    });
    const formValues = this.payrollForm.value;

    // Calculate Gross Pay (Sum of basic + allowances)
    this.grossPay =
      +formValues.basic +
      +formValues.hra +
      +formValues.conveyanceAllowance +
      +formValues.lta;
console.log('gp',this.grossPay);

    // Update Gross Pay and Yearly Gross Pay
    this.payrollForm.patchValue(
      {
        grossPay: this.grossPay,
        yeargrossPay: this.grossPay * 12
      },
      { emitEvent: false } // Prevent infinite loop by avoiding triggering valueChanges again
    );

    // Calculate Total Deductions
    this.totalDeductions =
      +formValues.gratuity + +formValues.pf + +formValues.insurance;

    // Calculate Net Pay (Gross Pay - Deductions)
    this.netPay = this.grossPay + this.totalDeductions;
    this.payrollForm.patchValue(
      {
        netPay: this.netPay,
        yearnetPay: this.netPay * 12
      },
      { emitEvent: false } // Prevent infinite loop by avoiding triggering valueChanges again
    );
  }

  savePayrollDetails() {
    const payrollData = { ...this.payrollForm.getRawValue(), userId: this.user.id };
    this.payrollService.savePayroll(payrollData).subscribe({
      next: () => alert('Payroll details saved successfully!'),
      error: (error) => {
        alert('Error saving payroll details.');
        console.error(error);
      }
    });
  }

  updatePayroll() {
  //   const payrollData = { ...this.payrollForm.getRawValue(), userId: this.user.id };
  //   this.payrollService.updatePayroll(payrollData).subscribe({
  //     next: () => alert('Payroll details updated successfully!'),
  //     error: (error) => {
  //       alert('Error updating payroll details.');
  //       console.error(error);
  //     }
  //   });
  // }
}
}