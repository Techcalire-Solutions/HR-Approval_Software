import { Component, inject, OnInit } from '@angular/core';
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
import { SafePipe } from '../../add-approval/view-invoices/safe.pipe';
import { User } from '../../../common/interfaces/user';
import { LoginService } from '@services/login.service';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-expense',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCardModule, MatButtonModule, MatIconModule, SafePipe,
    MatOptionModule, MatSelectModule
  ],
  templateUrl: './expense.component.html',
  styleUrl: './expense.component.scss'
})
export class ExpenseComponent implements OnInit{
  ngOnInit(): void {
    this.addDoc();
    this.generateInvoiceNumber();
    this.getAM()
  }
  private fb = inject(FormBuilder)
  private expenseService = inject(ExpensesService);
  private snackBar = inject(MatSnackBar);
  private loginService = inject(LoginService);
  
  expenseForm = this.fb.group({
    exNo: ['', Validators.required],
    expenseType: ['', Validators.required],
    notes: [''],
    url: this.fb.array([]),
    status: [{ value: 'Generated', disabled: true }],
    amId: []
  });

  fileType: any[] = [];
  uploadSub!: Subscription;
  imageUrl: any[] = [];
  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    let file: any = input.files?.[0];
    this.fileType[i] = file.type.split('/')[1]
    if (file) {
        let inv = this.ivNum;
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
    // this.invoiceService.deleteUploadByurl(this.imageUrl[i]).subscribe(data=>{
    //   this.imageUrl[i] = ''
    //     this.doc().at(i).get('docUrl')?.setValue('');
    //   this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    // });
  }

  removeData(index: number) {
    const formGroup = this.doc().at(index).value;
    this.doc().removeAt(index)
    if (formGroup.url !== null) {
      // this.invoiceService.deleteUploadByurl(formGroup.url).subscribe({
      //   next: (response) => {
      //     this.doc().removeAt(index)
      //   },
      //   error: (error) => {
      //     console.error('Error during update:', error);
      //   }
      // });
    } else {
      this.doc().removeAt(index)
    }
  }

  isImageUploaded(): boolean {
    const controls = this.expenseForm.get('url') as FormArray;
    const lastIndex = controls.length - 1;
  
    // Check if there is an image URL for the last index
    return this.imageUrl[lastIndex] ? true : false;
  }
  
  index!: number;
  clickedForms: boolean[] = [];
  addDoc(data?:any){
    this.doc().push(this.newDoc(data));
    this.clickedForms.push(false);
  }

  newDoc(initialValue?: any): FormGroup {
    return this.fb.group({
      url: [initialValue?initialValue.docUrl : '', Validators.required],
      remarks: [initialValue?initialValue.docUrl : ''],
    });
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

        let nextId = maxId + 1;
        const paddedId = `${this.prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      } else {
        let nextId = 1;
        let prefix = "REQ-";
        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      }

      this.expenseForm.get('exNo')?.setValue(this.ivNum);
    });
  }

  extractLetters(input: string): string {
    var extractedChars = input.match(/[A-Za-z-]/g);
    var result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  submit!: Subscription;
  onSubmit(){
    console.log(this.expenseForm.getRawValue());
    this.submit = this.expenseService.addExpense(this.expenseForm.getRawValue()).subscribe(res =>{
      console.log(res);
      this.snackBar.open("Expense added succesfully...","" ,{duration:3000})
      // this.router.navigate(['/view-invoices']);
    })
  }

  amSub!: Subscription;
  AMList: User[] = [];
  getAM(){
    this.amSub = this.loginService.getUserByRoleName('Manager').subscribe(user =>{
      this.AMList = user;
    });
  }

}
