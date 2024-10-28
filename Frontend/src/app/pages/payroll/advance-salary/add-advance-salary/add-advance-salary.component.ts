import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
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
import { PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { CompanyService } from '@services/company.service';
import { Subscription } from 'rxjs';
import { Company } from '../../../../common/interfaces/company';
import { User } from '../../../../common/interfaces/user';
import { DeleteDialogueComponent } from '../../../../theme/components/delete-dialogue/delete-dialogue.component';
import { SafePipe } from '../../../add-approval/view-invoices/safe.pipe';
import { LeaveType } from '../../../../common/interfaces/leaveType';
import { AddCompanyComponent } from '../../../company/add-company/add-company.component';
import { PayrollService } from '@services/payroll.service';
import { UsersService } from '@services/users.service';

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
export class AddAdvanceSalaryComponent {
  formBuilder=inject(FormBuilder);
  datePipe=inject(DatePipe)
  payrollService=inject(PayrollService)
  _snackBar=inject(MatSnackBar)
  dialog=inject(MatDialog)
  router=inject(Router)
  dialogRef = inject(MatDialogRef<AddCompanyComponent>, { optional: true })
  dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  userService=inject(UsersService)

  advanceSalaryForm = this.formBuilder.group({
    userId: ['', Validators.required],
    scheme: ['OnetimeSettlement'],
    amount: ['',Validators.required],
    reason: ['',Validators.required],

  });

  navigation = this.router.getCurrentNavigation();
  company = this.navigation?.extras.state?.['company'];
  ngOnInit(){
    this.getUsers()
    // if (this.company) {
    //   this.patchCompany(this.company);
    // }
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    // this.getCompany()
    // if(this.dialogData){
    //   console.log(this.dialogData);
      
    //   this.advanceSalaryForm.get('companyName')?.setValue(this.dialogData.name);
    //   if(this.dialogData.type === 'sup') this.advanceSalaryForm.get('supplier')?.setValue(true);
    //   else if(this.dialogData.type === 'cust') this.advanceSalaryForm.get('customer')?.setValue(true);
    // }
  }

  leaveTypes: LeaveType[] = [];
  roleSub!: Subscription;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  // getLeaveTypes(){
  //   this.roleSub = this.leaveService.getLeaveType(this.searchText, this.currentPage, this.pageSize).subscribe((res: any)=>{
  //     this.leaveTypes = res.items;
  //     this.totalItems = res.count;
  //     console.log('hiii',res);
      
  //   })
  // }
  // public companies: Company[] | null;
  // public getCompany(): void {
  //   this.companies = null; //for show spinner each time
  //   this.companyService.getCompany().subscribe((companies: any) =>{
  //     this.companies = companies
  //   });
  // }
  // public searchText!: string;
  // search(event: Event){
  //   this.searchText = (event.target as HTMLInputElement).value.trim()
  //   this.getCompany()
  // }

  // company: Company;
  // patchCompany(company: any){
  //   console.log('company',company);
  //   this.advanceSalaryForm.patchValue({
  //     userId: this.company.companyName,
  //     code: this.company?.code,
  //     contactPerson: this.company?.contactPerson,
  //     designation:this.company?.designation,
  //     email:this.company?.email,
  //     website: this.company?.website,
  //     phoneNumber: this.company?.phoneNumber,
  //     address1: this.company?.address1,
  //     address2: this.company?.address2,
  //     city:this.company?.city,
  //     country: this.company?.country,
  //     state: this.company?.state,
  //     zipcode: this.company?.zipcode,
  //     linkedIn: this.company?.linkedIn,
  //     remarks: this.company?.remarks,
  //     customer: this.company?.customer,
  //     supplier: this.company?.supplier,
  //   })
  // }
  close(): void {
    this.dialogRef?.close()
    history.back();
  }
  
  manageUser() {

  }
   users: User[] = [];
  getUsers() {
    this.userService.getUser().subscribe((result) => {
      this.users = result;
    })
  }
  onSubmit(){
    if(this.company){
      this.payrollService.updateAdvanceSalary(this.company.id, this.advanceSalaryForm.getRawValue()).subscribe(data => {
        if (this.dialogRef) this.dialogRef.close();
        else  this.router.navigateByUrl('/login/advance-salary');
        
        this._snackBar.open("advance salary updated succesfully...","" ,{duration:1000})
        // this.getCompany();
        this.router.navigateByUrl('/login/advance-salary')
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