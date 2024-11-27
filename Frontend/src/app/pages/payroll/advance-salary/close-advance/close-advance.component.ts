import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PayrollService } from '@services/payroll.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-close-advance',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './close-advance.component.html',
  styleUrl: './close-advance.component.scss'
})
export class CloseAdvanceComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.advanceSalarySub?.unsubscribe();
    this.closeSub?.unsubscribe();
  }

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CloseAdvanceComponent>, { optional: true })
  public dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  advanceSalaryForm = this.fb.group({
    amountToPay: [0],
    amountPayed: [0, [Validators.required, Validators.min(1)]],
    closeNote: ['']
  });

  ngOnInit(): void {
    this.getAdvanceSalary()
  }

  advanceSalarySub!: Subscription;
  private payrollService = inject(PayrollService);
  getAdvanceSalary(){
  this.advanceSalarySub = this.payrollService.getAdvanceSalaryByid(this.dialogData.id).subscribe(data => {
      if(data){
        const balance = data.amount - (data.monthlyPay * data.completed);
        this.advanceSalaryForm.get('amountToPay')?.setValue(balance)
      }
    });
  }

  closeSub!: Subscription;
  onSubmit(): void {
    if(this.advanceSalaryForm.get('amountToPay')?.value !== this.advanceSalaryForm.get('amountPayed')?.value){
      return alert('The payment amount entered is incorrect. Please ensure the amount to pay is not equal to the amount paid.');
    }
    this.closeSub = this.payrollService.closeAdvanceSalary(this.dialogData.id, this.advanceSalaryForm.getRawValue()).subscribe(data => {
      alert(`The advance payment was successfully closed on ${data.completedDate}.`);
      this.dialogRef?.close();
    });
  }

  close(): void {
    this.dialogRef?.close();
  }
}
