import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-user-account',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatOptionModule, MatSelectModule, MatInputModule, MatButtonModule,
       MatCardModule, MatIconModule ],
  templateUrl: './edit-user-account.component.html',
  styleUrl: './edit-user-account.component.scss'
})
export class EditUserAccountComponent implements OnInit, OnDestroy{
  dialogRef = inject(MatDialogRef<EditUserAccountComponent>, { optional: true })
  accountData = inject(MAT_DIALOG_DATA, { optional: true });

  ngOnInit(): void {
    if(this.accountData){
      this.getPositionDetailsByUser(this.accountData.id)
    }
  }

  private pUSub!: Subscription;
  id: number;
  getPositionDetailsByUser(id: number){
    this.pUSub = this.userService.getUserAcoountDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          accountNo : data.accountNo,
          ifseCode : data.ifseCode,
          paymentFrequency : data.paymentFrequency,
          modeOfPayment : data.modeOfPayment,
          branchName : data.branchName,
          bankName : data.bankName
        })
      }
    })
  }

  private fb = inject(FormBuilder);
  form = this.fb.group({
    userId : [''],
    accountNo : [''],
    ifseCode : [''],
    paymentFrequency : [''],
    modeOfPayment : [''],
    branchName : ['Vyttila'],
    bankName: ['Axis']
  });

    private submitSub!: Subscription;
    isNext: boolean = false;
    editStatus: boolean = false;
    private userService = inject(UsersService);
    private snackBar = inject(MatSnackBar);
    onSubmit(){
      this.isNext = true
      const submit = {
        ...this.form.getRawValue()
      }
      submit.userId = submit.userId ? submit.userId : this.accountData.id;
      if(this.editStatus){
        this.submitSub = this.userService.updateUserAccount(this.id, submit).subscribe(() => {
          this.dialogRef?.close()
          this.snackBar.open("Account Details updated succesfully...","" ,{duration:3000})
        })}
      else{
        this.submitSub = this.userService.addUserAccountDetails(submit).subscribe((res) => {        
          this.editStatus = true;
          this.id = res.id;
          this.dialogRef?.close()
          this.snackBar.open("Account Details added succesfully...","" ,{duration:3000})
        })}
    }

    ngOnDestroy(): void {
      this.pUSub?.unsubscribe();
      this.submitSub?.unsubscribe();
    }
}
