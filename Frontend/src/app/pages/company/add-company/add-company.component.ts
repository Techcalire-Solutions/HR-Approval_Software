import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { LeaveType } from '../../../common/interfaces/leaveType';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CompanyService } from '@services/company.service';
import { Company } from '../../../common/interfaces/company';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
@Component({
  selector: 'app-add-company',
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
    MatProgressSpinnerModule,
    MatDialogModule,
    MatCheckboxModule],
    providers: [DatePipe],
  templateUrl: './add-company.component.html',
  styleUrl: './add-company.component.scss'
})
export class AddCompanyComponent {
  formBuilder=inject(FormBuilder);
  datePipe=inject(DatePipe)
  companyService=inject(CompanyService)
  _snackBar=inject(MatSnackBar)
  dialog=inject(MatDialog)
  router=inject(Router)
  dialogRef = inject(MatDialogRef<AddCompanyComponent>, { optional: true })
  dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  companyForm = this.formBuilder.group({
    companyName: ['', Validators.required],
    code: [''],
    contactPerson: [''],
    designation:[''],
    email:[''],
    website: [''],
    phoneNumber: [''],
    address1: [''],
    address2: [''],
    city: [''],
    country: [''],
    state: [''],
    zipcode: [''],
    linkedIn: [''],
    remarks: [''],
    customer: [false],
    supplier: [false],
  });

  navigation = this.router.getCurrentNavigation();
  company = this.navigation?.extras.state?.['company'];
  ngOnInit(){
    if (this.company) {
      this.patchCompany(this.company);
    }
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.getCompany()
    if(this.dialogData){
      console.log(this.dialogData);
      
      this.companyForm.get('companyName')?.setValue(this.dialogData.name);
      if(this.dialogData.type === 'sup') this.companyForm.get('supplier')?.setValue(true);
      else if(this.dialogData.type === 'cust') this.companyForm.get('customer')?.setValue(true);
    }
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
  public companies: Company[] | null;
  public getCompany(): void {
    this.companies = null; //for show spinner each time
    this.companyService.getCompany().subscribe((companies: any) =>{
      this.companies = companies
    });
  }
  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getCompany()
  }

  // company: Company;
  patchCompany(company: any){
    console.log('company',company);
    this.companyForm.patchValue({
      companyName: this.company.companyName,
      code: this.company?.code,
      contactPerson: this.company?.contactPerson,
      designation:this.company?.designation,
      email:this.company?.email,
      website: this.company?.website,
      phoneNumber: this.company?.phoneNumber,
      address1: this.company?.address1,
      address2: this.company?.address2,
      city:this.company?.city,
      country: this.company?.country,
      state: this.company?.state,
      zipcode: this.company?.zipcode,
      linkedIn: this.company?.linkedIn,
      remarks: this.company?.remarks,
      customer: this.company?.customer,
      supplier: this.company?.supplier,
    })
  }
  close(): void {
    this.dialogRef?.close()
    history.back();
  }
  onSubmit(){
    if(this.company){
      this.companyService.updateCompany(this.company.id, this.companyForm.getRawValue()).subscribe(data => {
        if (this.dialogRef) this.dialogRef.close();
        else  this.router.navigateByUrl('/login/company');
        
        this._snackBar.open("Company updated succesfully...","" ,{duration:1000})
        this.getCompany();
        this.router.navigateByUrl('/login/company')
      });
    }else{
      this.companyService.addCompany(this.companyForm.getRawValue()).subscribe((res)=>{
        if (this.dialogRef) this.dialogRef.close();
        else  this.router.navigateByUrl('/login/company');
        this._snackBar.open("Company added successfully...","" ,{duration:3000})
      })
    }
  }
}