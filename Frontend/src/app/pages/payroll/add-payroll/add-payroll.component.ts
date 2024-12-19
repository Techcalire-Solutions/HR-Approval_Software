/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';
import { Payroll } from '../../../common/interfaces/payRoll/payroll';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { PayrollUpdateVerificationComponent } from './payroll-update-verification/payroll-update-verification.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-payroll',
  standalone: true,
  templateUrl: './add-payroll.component.html',
  imports: [ReactiveFormsModule, CommonModule, MatButtonModule, MatIconModule, MatButtonModule],  // Include ReactiveFormsModule
  styleUrls: ['./add-payroll.component.scss']
})

export class AddPayrollComponent implements OnInit, OnDestroy {
    dialogRef = inject(MatDialogRef<AddPayrollComponent>, { optional: true })
    payrollData = inject(MAT_DIALOG_DATA, { optional: true });

  private userSub: Subscription;
  user: any;
  payroll: Payroll;
  private fb = inject(FormBuilder);

  payrollForm = this.fb.group({
    basic: [null, [Validators.required]],
    yearbasicPay: <any>[{ value: null, disabled: true }],
    hra: <any>[null,[ Validators.required]],
    yearhra: <any>[{ value: null, disabled: true }],
    conveyanceAllowance: <any>[null, Validators.required],
    yearconveyanceAllowance: <any>[{ value: null, disabled: true }],
    lta: <any>[null],
    yearlta: <any>[{ value: null, disabled: true }],
    specialAllowance: <any>[null, Validators.required],
    yearspecialAllowance: <any>[{ value: null, disabled: true }],
    pf: <any>[null, Validators.required],
    yearpf: <any>[{ value: null, disabled: true }],
    insurance: <any>[null],
    gratuity: <any>[null],
    yeargrossPay:  <any>[{ value: null, disabled: true }],
    grossPay: [{ value: null, disabled: true }],
    yearGratuity:  <any>[{ value: null, disabled: true }],
    yearinsurance:  <any>[{ value: null, disabled: true }],
    netPay:  <any>[{ value: null, disabled: true }],
    yearnetPay:  <any>[{ value: null, disabled: true }],
    userName: [''],
    userRole: [''],
    pfDeduction: <any>[null, Validators.required],
    yearPfDeduction: <any>[{ value: null, disabled: true }],
    esi: <any>[null, Validators.required],
    yearEsi: <any>[{ value: null, disabled: true }],
  });

  private changeSub!: Subscription;
  ngOnInit(): void {
    this.getUserById();
    this.getPayrollDetailsByUserId();

    this.changeSub = this.payrollForm.valueChanges.subscribe(() => {
      this.calculatePayroll();
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.payrollSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
    this.updatePaySub?.unsubscribe();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private userService = inject(UsersService);
  private route = inject(ActivatedRoute);
  getUserById() {
    const id = this.route.snapshot.params['id'] ? this.route.snapshot.params['id'] : this.payrollData.id;
    this.userSub = this.userService.getUserById(id).subscribe((res) => {
      this.user = res;
      this.userName = res.name;
      this.empNo = res.empNo;
      this.payrollForm.get('userName')?.setValue(this.user.name);
      this.payrollForm.get('userRole')?.setValue(this.user.role.roleName);
    });
  }

  private payrollService = inject(PayrollService);
  editStaus: boolean = false;
  userName: string;
  empNo: string;
  private payrollSub!: Subscription;
  getPayrollDetailsByUserId() {
    const id = this.route.snapshot.params['id'] ? this.route.snapshot.params['id'] : this.payrollData.id;
    this.payrollSub = this.payrollService.getPayrollDetailsByUserId(id).subscribe({
      next: (res) => {
        if (res) {
          this.editStaus = true;
          this.payroll = res;
          this.patchForm(this.payroll)
        }
      },
      error: (err) => {
        console.error('Error fetching payroll:', err);
      }
    });
  }

  private id: number;
  netPay: number;
  patchForm(value: any){
    this.id = value.id;
    this.netPay = value.netPay;
    this.payrollForm.patchValue({
      basic: value.basic,
      yearbasicPay: value.basic * 12,
      hra: value.hra,
      yearhra: value.hra * 12,
      conveyanceAllowance: value.conveyanceAllowance,
      yearconveyanceAllowance: value.conveyanceAllowance * 12,
      lta: value.lta,
      yearlta: value.lta * 12,
      specialAllowance: value.specialAllowance,
      yearspecialAllowance: value.specialAllowance * 12,
      pf: value.pf,
      yearpf: value.pf * 12,
      insurance: value.insurance,
      gratuity: value.gratuity,
      grossPay: value.grossPay,
      yeargrossPay: value.grossPay * 12,
      yearGratuity: value.gratuity * 12,
      yearinsurance:  value.insurance * 12,
      netPay:  value.netPay,
      yearnetPay:  value.netPay * 12,
      pfDeduction: value.pfDeduction,
      yearPfDeduction: value.pfDeduction * 12,
      esi: value.esi,
      yearEsi: value.esi * 12,
    })
  }

  private subscriptions: any[] = [];
  calculatePayroll() {
    this.subscriptions.push(
      this.payrollForm.get('basic')?.valueChanges.subscribe(() => {
        const bp: any = this.payrollForm.get('basic')?.value;
        const ybp = 12 * bp;
        this.payrollForm.patchValue({ yearbasicPay: ybp }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('hra')?.valueChanges.subscribe(() => {
        const hr: any = this.payrollForm.get('hra')?.value;
        const yhr = 12 * hr;
        this.payrollForm.patchValue({ yearhra: yhr }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('conveyanceAllowance')?.valueChanges.subscribe(() => {
        const conveyanceAllowance: any = this.payrollForm.get('conveyanceAllowance')?.value;
        const yca = 12 * conveyanceAllowance;
        this.payrollForm.patchValue({ yearconveyanceAllowance: yca }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('lta')?.valueChanges.subscribe(() => {
        const lta: any = this.payrollForm.get('lta')?.value;
        const ylta = 12 * lta;
        this.payrollForm.patchValue({ yearlta: ylta }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('specialAllowance')?.valueChanges.subscribe(() => {
        const specialAllowance: any = this.payrollForm.get('specialAllowance')?.value;
        const yearspecialAllowance = 12 * specialAllowance;
        this.payrollForm.patchValue({ yearspecialAllowance: yearspecialAllowance }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('gratuity')?.valueChanges.subscribe(() => {
        const gratuity: any = this.payrollForm.get('gratuity')?.value;
        const ygratuity = 12 * gratuity;
        this.payrollForm.patchValue({ yearGratuity: ygratuity }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('insurance')?.valueChanges.subscribe(() => {
        const insurance: any = this.payrollForm.get('insurance')?.value;
        const yinsurance = 12 * insurance;
        this.payrollForm.patchValue({ yearinsurance: yinsurance }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('pf')?.valueChanges.subscribe(() => {
        const pf: any = this.payrollForm.get('pf')?.value;
        const ypf = 12 * pf;
        this.payrollForm.patchValue({ yearpf: ypf }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('pfDeduction')?.valueChanges.subscribe(() => {
        const pf: any = this.payrollForm.get('pfDeduction')?.value;
        const ypf = 12 * pf;
        this.payrollForm.patchValue({ yearPfDeduction: ypf }, { emitEvent: false });
        this.calculateGrossPay();
      }),
      this.payrollForm.get('esi')?.valueChanges.subscribe(() => {
        const pf: any = this.payrollForm.get('esi')?.value;
        const ypf = 12 * pf;
        this.payrollForm.patchValue({ yearEsi: ypf }, { emitEvent: false });
        this.calculateGrossPay();
      })
    );
  }

  calculateGrossPay() {
    const basic: number = Number(this.payrollForm.get('basic')?.value) || 0;   
    const hra: number = Number(this.payrollForm.get('hra')?.value) || 0;
    const conveyanceAllowance: number = Number(this.payrollForm.get('conveyanceAllowance')?.value) || 0;
    const lta: number = Number(this.payrollForm.get('lta')?.value) || 0;
    const specialAllowance: number = Number(this.payrollForm.get('specialAllowance')?.value) || 0;
    const gratuity: number = Number(this.payrollForm.get('gratuity')?.value) || 0;
    const insurance: number = Number(this.payrollForm.get('insurance')?.value) || 0;
    const pf: number = Number(this.payrollForm.get('pf')?.value) || 0;

    const grossPay: any = basic + hra + conveyanceAllowance + lta + specialAllowance;
    const netPay: any = grossPay + gratuity + insurance + pf;
    
    this.payrollForm.patchValue({ 
      grossPay: grossPay, yeargrossPay: grossPay * 12, netPay: netPay, yearnetPay: netPay * 12 
    }, { emitEvent: false });
  }

  private dialog = inject(MatDialog);
  private updatePaySub!: Subscription;
  dialogSub!: Subscription;
  savePayrollDetails() {
    if(this.editStaus){
      const dialogRef = this.dialog.open(PayrollUpdateVerificationComponent, {
        data: { userName: this.user.name, currentPay: this.netPay, updated: this.payrollForm.get('netPay')?.value }
      });
      this.dialogSub = dialogRef.afterClosed().subscribe((res) => {
        if(res){
          const payrollData = { ...this.payrollForm.getRawValue() };
          this.updatePaySub = this.payrollService.updatePayroll(this.id, payrollData).subscribe({
            next: () => {
              alert('Payroll details updated successfully!')
              if(this.dialogRef) this.dialogRef.close();
              else history.back();
            },
            error: () => {
              alert('Error saving payroll details.');
            }
          });
        }else{
          alert('Please note: The payroll update has not been saved.')
          this.getPayrollDetailsByUserId()
        }
      });
    }else{
      const payrollData = { ...this.payrollForm.getRawValue(), userId: this.user.id };
      this.updatePaySub = this.payrollService.savePayroll(payrollData).subscribe({
        next: () => {
          alert('Payroll details saved successfully!')
          if(this.dialogRef) this.dialogRef.close();
          else history.back();
        },
        error: () => {
          alert('Error saving payroll details.');
        }
      });
    }
  }

  downloadPDF() {
    const element: HTMLElement = document.querySelector('.payroll-container')!;
    
    const excludedElements = document.querySelectorAll('.exclude-from-pdf');
    excludedElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  
    html2canvas(element).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
  
      const imgWidth = 160; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Payroll_${this.userName}_${this.empNo}.pdf`);
  
      excludedElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
    });
  }
}
