/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-account',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatOptionModule, MatSelectModule, MatInputModule, MatButtonModule,
     MatCardModule, MatIconModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss'
})
export class UserAccountComponent implements OnInit, OnDestroy {
  ngOnDestroy(): void {
    this.pUSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }
  ngOnInit(): void {
    this.form.get('paymentFrequency')?.setValue('Monthly');
    this.form.get('modeOfPayment')?.setValue('BankTransfer')
  }

  @Input() accountData: any;
  @Input() data: any;  
  @Input() loading = false;
  @Output() loadingState = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private userService = inject(UsersService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  form = this.fb.group({
    userId : [''],
    accountNo : [''],
    ifseCode : ['UTIB0000827'],
    paymentFrequency : [''],
    modeOfPayment : [''],
    branchName : ['Vyttila'],
    bankName: ['Axis']
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      // if(data.updateStatus){
        this.getPositionDetailsByUser(data.id)
      // }
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

  @Output() dataSubmitted = new EventEmitter<any>();
  private submitSub!: Subscription;
  isNext: boolean = false;
  onSubmit(){
    this.loadingState.emit(true);
    this.isNext = true
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.accountData.id;
    if(this.editStatus){
      this.submitSub = this.userService.updateUserAccount(this.id, submit).subscribe(() => {
        this.snackBar.open("Account Details updated succesfully...","" ,{duration:3000})
        this.loadingState.emit(false);
        // this.dataSubmitted.emit( {isFormSubmitted: true} );
      })}
    else{
      this.submitSub = this.userService.addUserAccountDetails(submit).subscribe((res) => {        
        this.editStatus = true;
        this.id = res.id;
        this.snackBar.open("Account Details added succesfully...","" ,{duration:3000})
        this.loadingState.emit(false);
      })}
  }

  @Output() nextTab = new EventEmitter<void>();
  triggerNextTab() {
    this.nextTab.emit();
  }

  @Output() previousTab = new EventEmitter<void>();
  triggerPreviousTab() {
    this.previousTab.emit();
  }
}
