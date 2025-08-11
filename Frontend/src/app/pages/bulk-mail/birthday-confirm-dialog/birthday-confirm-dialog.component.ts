import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-birthday-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './birthday-confirm-dialog.component.html',
  styleUrls: ['./birthday-confirm-dialog.component.scss']
})
export class BirthdayConfirmDialogComponent {

    private dialogRef = inject(MatDialogRef<BirthdayConfirmDialogComponent>)
    public data: {employeeName: string} = inject(MAT_DIALOG_DATA);
  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}