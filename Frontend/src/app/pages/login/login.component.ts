import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginService } from '@services/login.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class LoginComponent {
  isSignUpMode = false;
  errorMessage: string | null = null;

  loginForm = this.fb.group({
    empNo: ['', Validators.required],
    password: ['', Validators.required]
  });

  signUpForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService,
    private snackBar: MatSnackBar
  ) {}

  toggleSignUpMode(isSignUp: boolean = true): void {
    this.isSignUpMode = isSignUp;
  }

  onSignIn(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please fill in all fields correctly. Incorrect Username/password';
      return;
    }

    this.loginService.loginUser(this.loginForm.value).subscribe({
      next: (res: boolean) => { // Adjust type according to the actual response

        if (res) { // Check if the response indicates success
          this.setCurrentUser(res); // Assuming `res` contains user information
          this.router.navigate(['/login']); // Redirect after successful login
        } else {
          this.errorMessage = 'Incorrect username or password';
          this.snackBar.open('Incorrect username or password', 'Close', {
            duration: 3000,
          });
        }
      },
      error: (err) => {
        this.errorMessage = 'Invalid username or password';
        this.snackBar.open('Invalid username or password', 'Close', {
          duration: 3000,
        });
      }
    });
  }



  onSignUp(): void {
    if (this.signUpForm.invalid) {
      this.snackBar.open('Please fill in all fields correctly.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Handle sign-up logic here
    this.snackBar.open('Sign-up functionality is not implemented yet.', 'Close', {
      duration: 3000,
    });
  }

  setCurrentUser(user: any): void {
    if (user && user.token) {
      localStorage.setItem('token', JSON.stringify(user.token));
      // Handle additional user data if needed
    }
  }
}
