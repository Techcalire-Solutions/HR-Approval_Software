/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MY_FORMATS } from '../personal-details/personal-details.component';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, CommonModule, MatNativeDateModule,
    MatDatepickerModule, MatToolbarModule, MatIconModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  standalone: true,
  providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
})
export class ConfirmationDialogComponent {
  ngOnDestroy(): void {
  }
  ngOnInit(): void {

  }

  private fb = inject(FormBuilder);
  public data = inject(MAT_DIALOG_DATA);

  separationForm = this.fb.group({
    note: ['']
  });

  private dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>)
  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  datePipe = inject( DatePipe )
  onConfirm(): void {
    if (this.separationForm.valid) {
      this.dialogRef.close({
        confirmed: true, note: this.separationForm.value.note
      });
    }
  }

}
