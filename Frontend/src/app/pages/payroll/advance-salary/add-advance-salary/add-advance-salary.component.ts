import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../../../common/interfaces/user';
import { SafePipe } from '../../../add-approval/view-invoices/safe.pipe';
import { LeaveType } from '../../../../common/interfaces/leaveType';
import { AddCompanyComponent } from '../../../company/add-company/add-company.component';
import { PayrollService } from '@services/payroll.service';
import { UsersService } from '@services/users.service';
import { AdvanceSalary } from '../../../../common/interfaces/advanceSalary';

@Component({
  selector: 'app-add-advance-salary',
  standalone: true,
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatCardModule,
    MatNativeDateModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule, SafePipe,
    MatDialogModule,
    MatCheckboxModule],
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
    scheme: ['OnetimeSettlement'],
    amount: <any>['',Validators.required],
    reason: ['',Validators.required],

  });

  ngOnInit(){
    console.log(this.dialogData);
    this.getUsers()
    if(this.dialogData){
      this.patchdata(this.dialogData.salary);
    }
  }

  close(){
    this.dialogRef?.close();
  }

  manageUser(){}

  piSub!: Subscription;
  editStatus: boolean = false;
  fileName!: string;
  piNo: string;
  savedImageUrl: any[] = [];
  patchdata(data: AdvanceSalary) {
    this.editStatus = true;
    console.log(data);
      
    // let inv: Expense = pi.pi;
    // this.piNo = inv.exNo
    this.advanceSalaryForm.patchValue({
      userId: data.userId,
      scheme: data.scheme,
      amount: data.amount,
      reason: data.reason,
    });
  }

   users: User[] = [];
  getUsers() {
    this.userService.getUser().subscribe((result) => {
      this.users = result;
    })
  }
  onSubmit(){
    if(this.dialogData){
      this.payrollService.updateAdvanceSalary(this.dialogData.salary.id, this.advanceSalaryForm.getRawValue()).subscribe(data => {
        if (this.dialogRef) this.dialogRef.close();
        this._snackBar.open("advance salary updated succesfully...","" ,{duration:1000})
      });
    }else{
      this.payrollService.addAdvanceSalary(this.advanceSalaryForm.getRawValue()).subscribe((res)=>{
        if (this.dialogRef) this.dialogRef.close();
        else  this.router.navigateByUrl('/login/advance-salary');
        this._snackBar.open("advance salary added successfully...","" ,{duration:3000})
      })
    }
  }
}