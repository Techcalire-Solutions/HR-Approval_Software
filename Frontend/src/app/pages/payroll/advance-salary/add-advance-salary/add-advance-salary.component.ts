/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PayrollService } from '@services/payroll.service';
import { UsersService } from '@services/users.service';
import { AdvanceSalary } from '../../../../common/interfaces/payRoll/advanceSalary';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { User } from '../../../../common/interfaces/users/user';

@Component({
  selector: 'app-add-advance-salary',
  standalone: true,
  imports: [MatAutocompleteModule, CommonModule, ReactiveFormsModule,  MatDatepickerModule,  MatFormFieldModule,
       MatIconModule, MatButtonModule, MatOptionModule, MatInputModule, MatSelectModule],
    providers: [DatePipe],
  templateUrl: './add-advance-salary.component.html',
  styleUrl: './add-advance-salary.component.scss'
})
export class AddAdvanceSalaryComponent implements OnInit{
  formBuilder=inject(FormBuilder);
  datePipe=inject(DatePipe)
  payrollService=inject(PayrollService)
  _snackBar=inject(MatSnackBar)
  dialog=inject(MatDialog)
  router=inject(Router)
  dialogRef = inject(MatDialogRef<AddAdvanceSalaryComponent>, { optional: true })
  dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  userService=inject(UsersService)

  advanceSalaryForm = this.formBuilder.group({
    userId: <any>['', Validators.required],
    scheme: ['OnetimeSettlement', Validators.required],
    amount: <any>['',Validators.required],
    reason: ['',Validators.required],
    userName: [''],
    duration: [ Validators.required],
    monthlyPay: []
  });

  ngOnInit(){
    this.getUsers()
    if(this.dialogData.salary){
      this.patchdata(this.dialogData.salary);
    }
  }

  close(){
    this.dialogRef?.close();
  }


  getUsers() {
    this.userService.getUser().subscribe((result) => {
      this.users = result;
      this.filteredUsers = result;
    })
  }

  filteredUsers: User[] = [];
  filterValue = '';
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredUsers = this.users.filter(option =>
      option.name.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.empNo.toString().replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
  }

  patch(selectedSuggestion: User, type: string) {
    if(type === 'sup') this.advanceSalaryForm.patchValue({ userId: selectedSuggestion.id, userName: selectedSuggestion.name });
    else if(type === 'cust')  this.advanceSalaryForm.patchValue({ userId: selectedSuggestion.id, userName: selectedSuggestion.name});
  }

  findAmount(){

  }

  manageUser(){}

  piSub!: Subscription;
  editStatus: boolean = false;
  fileName!: string;
  piNo: string;
  savedImageUrl: any[] = [];
  patchdata(data: AdvanceSalary) {
    this.editStatus = true;
    this.advanceSalaryForm.patchValue({
      userId: data.userId,
      scheme: data.scheme,
      amount: data.amount,
      reason: data.reason,
    });
  }

   users: User[] = [];
  onSubmit(){
    console.log(this.advanceSalaryForm.getRawValue());

    // if(this.dialogData){
    //   this.payrollService.updateAdvanceSalary(this.dialogData.salary.id, this.advanceSalaryForm.getRawValue()).subscribe(data => {
    //     if (this.dialogRef) this.dialogRef.close();
    //     this._snackBar.open("advance salary updated succesfully...","" ,{duration:1000})
    //   });
    // }else{
    //   this.payrollService.addAdvanceSalary(this.advanceSalaryForm.getRawValue()).subscribe((res)=>{
    //     if (this.dialogRef) this.dialogRef.close();
    //     else  this.router.navigateByUrl('/login/advance-salary');
    //     this._snackBar.open("advance salary added successfully...","" ,{duration:3000})
    //   })
    // }
  }
}
