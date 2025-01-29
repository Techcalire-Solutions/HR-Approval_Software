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

  message: string = '';
  appliedLeaveDates: { date: string; session1: boolean; session2: boolean }[] = [];
  lopDates: { date: string; session1: boolean; session2: boolean }[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      message: string;
      leaveDatesApplied?: { date: string; session1: boolean; session2: boolean }[];
      lopDates?: { date: string; session1: boolean; session2: boolean }[];
    },
    private dialogRef: MatDialogRef<LeaveInfoDialogComponent>
  ) {
    if (data) {
      this.message = data.message;
      this.appliedLeaveDates = this.formatDates(data.leaveDatesApplied || []);
      this.lopDates = this.formatDates(data.lopDates || []);
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
      this.message.includes('balance is 0') ||
      this.message.includes('No leave will be applied') ||
      this.message.includes('You do not have')
    ) {
      this.showOkButton = false;
      this.showCancelButton = true;
    } else {
      this.showOkButton = true;
      this.showCancelButton = false;
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
