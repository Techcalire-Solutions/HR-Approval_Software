import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-leave-details',
  imports: [MatListModule, MatButtonModule, DatePipe],
  templateUrl: './leave-details.component.html',
  styleUrl: './leave-details.component.scss',
  standalone: true
})
export class LeaveDetailsComponent {
  dialogRef = inject(MatDialogRef<LeaveDetailsComponent>);
  data = inject(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
