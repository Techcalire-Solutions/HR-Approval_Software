import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-leave-info-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    CommonModule

  ],
  templateUrl: './leave-info-dialog.component.html',
  styleUrls: ['./leave-info-dialog.component.scss']
})
export class LeaveInfoDialogComponent {
  message: string = '';
  showOkButton: boolean = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<LeaveInfoDialogComponent>
  ) {
    if (data && data.message) {
      this.message = data.message;
      this.setOkButtonVisibility();
    }
  }


private setOkButtonVisibility() {

  if (this.message.includes('balance is 0') && this.message.includes('No leave will be applied')) {
    this.showOkButton = false;
        //  message: `You do not have ${leaveType.leaveTypeName} leave allotted.`
  // } else if (this.message.includes('User leave record not found')) {
  } else if (this.message.includes('You do not have')) {
    this.showOkButton = false;
  } else {
    this.showOkButton = true;
  }
}


  onBack() {
    this.dialogRef.close({ action: 'back' });
  }

  onCancel() {
    this.dialogRef.close({ action: 'cancel' });
  }

  onOk() {
    this.dialogRef.close({ action: 'proceed' });
  }
}
