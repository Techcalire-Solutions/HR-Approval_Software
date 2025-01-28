import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { LeaveService } from '@services/leave.service';
import { NewLeaveService } from '@services/new-leave.service';

@Component({
  selector: 'app-user-email',
  standalone: true,
  imports: [ MatToolbarModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule, MatListModule, MatButtonModule ],
  templateUrl: './user-email.component.html',
  styleUrl: './user-email.component.scss'
})
export class UserEmailComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.getOfiiceMail();
  }

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<UserEmailComponent>)
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  emailForm = this.fb.group({
    userId: [this.dialogData.userId],
    email: ['', Validators.required],
    appPassword: ['', Validators.required],
    type: [this.dialogData.type]
  });

  private userService = inject(UsersService);
  private userSub!: Subscription;
  getOfiiceMail(){
    this.userSub = this.userService.getUserPositionDetailsByUser(this.dialogData.userId).subscribe(res => {
      if(this.dialogData.type === 'Official' && res && res.officialMailId) this.emailForm.get('email')?.setValue(res.officialMailId);
      else if(this.dialogData.type === 'Project' && res && res.projectMailId) this.emailForm.get('email')?.setValue(res.projectMailId);
      else {
        alert(`${this.dialogData.type} Mail Id is not added, please contact HR administrator to add data.`);
        this.dialogRef.close(false);
      }
    });
  }

  showDetails: boolean = false;
  toggleDetails() {
    this.showDetails = !this.showDetails; // Toggle the visibility of details
  }

  sendEmail() {
    if (this.emailForm.valid) {
      const formData = this.emailForm.getRawValue();
      this.userService.addUserEmail(formData).subscribe(user => {
        this.dialogRef.close(formData);
      });
    }
  }

  close(){
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }
}
