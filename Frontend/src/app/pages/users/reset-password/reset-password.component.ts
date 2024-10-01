import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule, MatToolbarModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  dialogRef = inject(MatDialogRef<ResetPasswordComponent>) 
  data = inject(MAT_DIALOG_DATA);
  fb = inject(FormBuilder)
  form = this.fb.group({
    empNo: [this.data.empNo],
    paswordReset: [this.data.paswordReset],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  })

  ngOnInit() {
    this.form.get('confirmPassword')?.valueChanges.subscribe(() => {
      this.checkPasswords();
    });

    this.form.get('password')?.valueChanges.subscribe(() => {
      this.checkPasswords();
    });
  }

  passwordMismatch: boolean = false;
  checkPasswords() {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    this.passwordMismatch = password !== confirmPassword;
  }


  generateRandomPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log(password);
    
    this.form.get('password')?.setValue(password);
    this.form.get('confirmPassword')?.setValue(password);  // Clear confirm password
  }

  copyEmpNoAndPassword() {
    const empNo = this.form.get('empNo')?.value;
    const password = this.form.get('password')?.value;

    if (empNo && password) {
      const textToCopy = `Emp ID: ${empNo}\nPassword: ${password}`;
      navigator.clipboard.writeText(textToCopy).then(
        () => {
          console.log('Email and password copied to clipboard');
        },
        (err) => {
          console.error('Could not copy text: ', err);
        }
      );
    }
  }

  userService = inject(UsersService)
  snackBar = inject(MatSnackBar)
  reset!: Subscription;
  onSubmit(){
    this.reset = this.userService.resetPassword(this.data.id, this.form.getRawValue()).subscribe(x => {
      console.log(x);
      
      this.dialogRef.close();
      this.snackBar.open(`You have successfully reset ${this.data.empNo} password...`,"" ,{duration:3000})
    })
  }

  onCancelClick(){
    this.dialogRef.close();
  }

  showPassword: boolean = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  showConfirmedPassword: boolean = false;

  toggleConfirmedPasswordVisibility() {
    this.showConfirmedPassword = !this.showConfirmedPassword;
  }
}
