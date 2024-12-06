import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-update-sendmail',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatDialogModule, MatButtonModule, MatToolbarModule, MatIconModule],
  templateUrl: './update-sendmail.component.html',
  styleUrl: './update-sendmail.component.scss'
})
export class UpdateSendmailComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UpdateSendmailComponent>)
  
  emailForm = this.fb.group({
    email: ['']
  });
  sendEmail() {
    if (this.emailForm.valid) {
      const email = this.emailForm.get('email')?.value;
      this.dialogRef.close(email);
    } else {
      alert('Please enter a valid email address.');
    }
  }

  close(){
    this.dialogRef.close();
  }
}
