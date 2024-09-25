import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-account',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatOptionModule, MatSelectModule, MatInputModule, MatButtonModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss'
})
export class UserAccountComponent {
  @Input() accountData: any;

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  form = this.fb.group({
    userId : [''],
    accountNo : [''],
    ifseCode : [''],
    paymentFrequency : [''],
    modeOfPayment : ['']
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      console.log(data);
      
      if(data.updateStatus){
        this.editStatus = true;
        console.log(this.editStatus);
        
        this.getPositionDetailsByUser(data.id)
      }
    }
  }

  pUSub!: Subscription;
  getPositionDetailsByUser(id: number){
    console.log(id);
    this.pUSub = this.userService.getUserAcoountDetailsByUser(id).subscribe(data=>{
      if(data){
        this.form.patchValue({
          accountNo : data.accountNo,
          ifseCode : data.ifseCode,
          paymentFrequency : data.paymentFrequency,
          modeOfPayment : data.modeOfPayment
        })
      }
    })
  }

  @Output() dataSubmitted = new EventEmitter<any>();
  submitSub!: Subscription;
  onSubmit(){
    let submit = {
      ...this.form.getRawValue()
    }
    submit.userId = this.accountData.id;
    console.log(submit);

    this.submitSub = this.userService.addUserAccountDetails(submit).subscribe(data => {
      this.snackBar.open("Account Details added succesfully...","" ,{duration:3000})
      this.dataSubmitted.emit( {isFormSubmitted: true} );
    })
  }

  @Output() nextTab = new EventEmitter<void>(); 
  triggerNextTab() {
    this.nextTab.emit();
  }
}
