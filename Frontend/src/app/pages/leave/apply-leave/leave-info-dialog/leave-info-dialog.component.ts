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

  showOkButton: boolean = true;
  showCancelButton: boolean = false;

  message: any

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {message: any},
    private dialogRef: MatDialogRef<LeaveInfoDialogComponent>
  ) {
    if (data) {
      this.message = data.message;
    }
    this.setOkButtonVisibility();
  }

  private formatDates(dates: { date: string; session1: boolean; session2: boolean }[]): { date: string; session1: boolean; session2: boolean }[] {
    return dates.map(dateObj => ({
      ...dateObj,
      date: new Date(dateObj.date).toLocaleDateString('en-GB') // Format to dd/mm/yyyy
    }));
  }

  private setOkButtonVisibility() {
    if (
      this.message.message?.includes('Leave processed') ||
      this.message.message?.includes('LOP leave created') ||
      this.message.message?.includes('Leave updated successfully') 
    ) {
      this.showOkButton = true;
      this.showCancelButton = false;
    } else {
      this.showOkButton = false;
      this.showCancelButton = true;
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
