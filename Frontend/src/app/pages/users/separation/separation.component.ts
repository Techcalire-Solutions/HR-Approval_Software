import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-separation',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './separation.component.html',
  styleUrl: './separation.component.scss'
})
export class SeparationComponent {
  private fb = inject(FormBuilder);
  public data = inject(MAT_DIALOG_DATA);
  
  separationForm = this.fb.group({
    note: ['', Validators.required] // Separation note is required
  });


  
  private dialogRef = inject(MatDialogRef<SeparationComponent>)
  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (this.separationForm.valid) {
      this.dialogRef.close({ 
        confirmed: true, note: this.separationForm.value.note, date: new Date() 
      });
    }
  }

}
