import { Component, inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-payroll-update-verification',
  standalone: true,
  imports: [],
  templateUrl: './payroll-update-verification.component.html',
  styleUrl: './payroll-update-verification.component.scss'
})
export class PayrollUpdateVerificationComponent implements OnInit{
  dialogRef = inject(MatDialogRef<PayrollUpdateVerificationComponent>)
  dialogData = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
  }

  onOkClick(): void {
    this.dialogRef.close(true);
  }

  onCancelClick(): void {
    this.dialogRef.close(false);
  }
}
