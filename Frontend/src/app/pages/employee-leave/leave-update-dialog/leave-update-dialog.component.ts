import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LeaveInfoDialogComponent } from '../leave-info-dialog/leave-info-dialog.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-leave-update-dialog',
  standalone: true,
  imports: [
    CommonModule, MatIconModule
  ],
  templateUrl: './leave-update-dialog.component.html',
  styleUrl: './leave-update-dialog.component.scss'
})
export class LeaveUpdateDialogComponent {
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
    if (this.message.includes('Not enough leave balance for this update')) {
      this.showOkButton = false;

    }
    else {
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



