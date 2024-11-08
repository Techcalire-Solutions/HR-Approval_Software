/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { ExpensesService } from '@services/expenses.service';
import { Expense } from '../../../common/interfaces/expense';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../../common/interfaces/user';
import { LoginService } from '@services/login.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { RoleService } from '@services/role.service';
import { SafePipe } from '../../../common/safe.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, MatIconModule, SafePipe,
    MatOptionModule, MatSelectModule, CommonModule
  ],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent implements OnInit{
  id: number;
  private route = inject(ActivatedRoute);
  private roleService = inject(RoleService);

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    if(this.id){
      this.patchdata(this.id);
    }else{
      this.addDoc();
      this.generateInvoiceNumber();
    }
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)
    
    this.getRoleById(user.role)
  }

  roleSub!: Subscription;
  roleName: string;
  getRoleById(id: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName; 
      this.getAM() 
    })
  }

  private fb = inject(FormBuilder)
  private expenseService = inject(ExpensesService);
  private snackBar = inject(MatSnackBar);
  private loginService = inject(LoginService);
  
  expenseForm = this.fb.group({
    exNo: ['', Validators.required],
    notes: [''],
    url: this.fb.array([]),
    status: [{ value: 'Generated', disabled: true }],
    amId: <any>[],
    accountantId: <any>[],
    currency: <any>[],
    totalAmount: <any>[]
  });

  piSub!: Subscription;
  editStatus: boolean = false;
  fileName!: string;
  piNo: string;
  savedImageUrl: any[] = [];
  patchdata(id: number) {
    this.editStatus = true;
    this.piSub = this.expenseService.getExpenseById(id).subscribe((pi: any) => {
      const inv: Expense = pi.pi;
      this.piNo = inv.exNo
      this.expenseForm.patchValue({
        exNo: inv.exNo,
        status: inv.status,
        amId: inv.amId,
        notes: inv.notes,
        accountantId: inv.accountantId,
        totalAmount: inv.totalAmount,
        currency: inv.currency
      });

      for (let index = 0; index < pi.signedUrl.length; index++) {
        this.addDoc(pi.pi.url[index])
      }
      
      if (inv.url) {
        this.savedImageUrl = pi.signedUrl;
      }
    });
  }

  fileType: any[] = [];
  uploadSub!: Subscription;
  imageUrl: any[] = [];  
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png', 'plain'];
  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    const file: any = input.files?.[0];
    this.fileType[i] = file.type.split('/')[1]
    console.log(this.fileType[i]);
    
    if (!this.allowedFileTypes.includes(this.fileType[i])) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, TXT or PNG file.');
      return;
    }
    if (file) {
        const inv = this.ivNum;
        const name = `${inv}_${i}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);

        this.uploadSub = this.expenseService.uploadExpense(formData).subscribe({
            next: (invoice) => {
                this.doc().at(i).get('url')?.setValue(invoice.fileUrl);
                this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${invoice.fileUrl}`;
            }
        });
    }
  }

  doc(): FormArray {
    return this.expenseForm.get("url") as FormArray;
  }

  onDeleteImage(i: number){
    this.expenseService.deleteUploadByurl(this.imageUrl[i]).subscribe(()=>{
      this.imageUrl[i] = ''
      this.savedImageUrl[i] = ''
      this.doc().at(i).get('url')?.setValue('');
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    });
  }

  deleteSub!: Subscription;
  onDeleteUploadedImage(i: number){
    this.deleteSub = this.expenseService.deleteUploaded(this.route.snapshot.params['id'], i).subscribe(()=>{
      this.savedImageUrl[i] = '';
      this.imageUrl[i] = '';
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
      this.isImageUploaded()
    });
  }

  isImageUploaded(): boolean {
    const controls = this.expenseForm.get('url')as FormArray;
    if( controls.length === 0) {return true}
    const i = controls.length - 1;
    if (this.savedImageUrl[i] || this.imageUrl[i]) {
      return true;
    }else return false;
  }
  

  index!: number;
  clickedForms: boolean[] = [];
  addDoc(data?:any){
    this.doc().push(this.newDoc(data));
    this.clickedForms.push(false);
    this.cdr.detectChanges();
  }

  newDoc(initialValue?: any): FormGroup {
    return this.fb.group({
      url: [initialValue?initialValue.url : '', Validators.required],
      remarks: [initialValue?initialValue.remarks : ''],
    });
  }

  deleteUploadSub!: Subscription;  
  private cdr = inject(ChangeDetectorRef) 
  removeData(index: number) {
    if (index >= 0 && index < this.doc().length) {
        this.doc().removeAt(index);
        this.imageUrl.splice(index, 1);      
        this.savedImageUrl.splice(index, 1); 
    } else {
        console.warn(`Index ${index} is out of bounds for removal`);
    }
  }

  invSub!: Subscription;
  prefix: string = '';
  ivNum: string = '';
  generateInvoiceNumber() {
    this.invSub = this.expenseService.getExpense().subscribe((res: Expense[]) => {
      if (res.length > 0) {
        const maxId = res.reduce((prevMax, inv) => {
          const idNumber = parseInt(inv.exNo.replace(/\D/g, ''), 10);
          this.prefix = this.extractLetters(inv.exNo);
          return !isNaN(idNumber) && idNumber > prevMax ? idNumber : prevMax;
        }, 0);

        const nextId = maxId + 1;
        const paddedId = `${this.prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      } else {
        const nextId = 1;
        const prefix = "EXP-";
        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      }

      this.expenseForm.get('exNo')?.setValue(this.ivNum);
    });
  }

  extractLetters(input: string): string {
    const extractedChars = input.match(/[A-Za-z-]/g);
    const result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  submit!: Subscription;
  private router = inject(Router);
  onSubmit(){
    if(this.editStatus){
      this.submit = this.expenseService.updateExpense(this.expenseForm.getRawValue(), this.id).subscribe(res =>{
        console.log(res);
        
        this.snackBar.open("Expense updated succesfully...","" ,{duration:3000})
        if(this.roleName === 'Super Administrator' || this.roleName === 'Administrator'){
          this.router.navigateByUrl('login/viewApproval/view');
        }else{
          this.router.navigateByUrl('login/viewApproval/viewexpenses');
        }
      })
    }else{
      this.submit = this.expenseService.addExpense(this.expenseForm.getRawValue()).subscribe(() =>{
        this.snackBar.open("Expense added succesfully...","" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval/viewexpenses');
      })
    }

  }

  amSub!: Subscription;
  AMList: User[] = [];
  getAM(){
    let role;
    if(this.roleName === 'Manager'){
      role = 'Accountant'
    }else{
      role = 'Manager'
    }
    this.amSub = this.loginService.getUserByRoleName(role).subscribe(user =>{
      this.AMList = user;
    });
  }
}
