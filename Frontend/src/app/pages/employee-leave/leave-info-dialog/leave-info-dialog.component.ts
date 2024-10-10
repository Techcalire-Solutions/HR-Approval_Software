import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-leave-info-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule
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

  // Function to set visibility of the OK button based on message content
  private setOkButtonVisibility() {
    // Here, we check if the message contains specific text (e.g., "balance is 0")
    // that indicates the leave balance is zero.
    if (this.message.includes('Your Casual Leave balance is 0. No leave will be applied')) {
      this.showOkButton = false;  // Hide the OK button if leave balance is 0
    } else {
      this.showOkButton = true;   // Show the OK button in all other cases
    }
  }

  onBack() {
    // Close the dialog and signal that the user wants to go back
    this.dialogRef.close({ action: 'back' });
  }

  onCancel() {
    // Close the dialog and signal that the user has cancelled the request
    this.dialogRef.close({ action: 'cancel' });
  }

  onOk() {
    // Close the dialog and signal that the user wants to proceed with the request
    this.dialogRef.close({ action: 'proceed' });
  }
}
