import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
 // Import CommonModule

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

  // Function to set visibility of the OK button based on message content or messageType
  private setOkButtonVisibility() {
    // Updated condition to check for specific messages
    if (this.message.includes('balance is 0') && this.message.includes('No leave will be applied')) {
      this.showOkButton = false;  // Hide the OK button if leave balance is 0
    } else {
      this.showOkButton = true;   // Show the OK button in all other cases
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
