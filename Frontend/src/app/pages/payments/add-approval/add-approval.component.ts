import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '@services/login.service';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { CompanyService } from '@services/company.service';
import { CommonModule } from '@angular/common';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { SafePipe } from '../../../common/safe.pipe';
import { InvoiceService } from '@services/invoice.service';
import { environment } from '../../../../environments/environment';
import { Company } from '../../../common/interfaces/company';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { User } from '../../../common/interfaces/user';
import { AddCompanyComponent } from '../../company/add-company/add-company.component';
@Component({
  selector: 'app-add-approval',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatCardModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatInputModule, SafePipe, CommonModule, MatAutocompleteModule],
  templateUrl: './add-approval.component.html',
  styleUrl: './add-approval.component.scss'
})
export class AddApprovalComponent {
  url = environment.apiUrl;
  companyService =inject(CompanyService)
  invoiceService=inject(InvoiceService)
  loginService=inject(LoginService)
  snackBar=inject(MatSnackBar)
  router=inject(Router)
  route=inject(ActivatedRoute)
  dialog=inject(MatDialog)
  sanitizer=inject(DomSanitizer)
  fb=inject(FormBuilder)

  ngOnDestroy(): void {
    this.invSub?.unsubscribe();
    this.uploadSub?.unsubscribe();
    this.submit?.unsubscribe();
  }

  ngOnInit(): void {
    this.getSuppliers();
    this.getCustomers()
    this.generateInvoiceNumber()
    this.getKAM();
    this.getAM();
    this.getAccountants();

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
    this.addDoc()
  }

  id!: number;
  supplierCompanies: Company[] = []; 
  public customerCompanies: Company[] = [];
  public filteredOptions: any[] = [];
  public getSuppliers(): void {
    this.companyService.getSuppliers().subscribe((suppliers: any) => {
      this.supplierCompanies = suppliers;
      this.filteredOptions = this.supplierCompanies
    });
  }
  
  filterValue: string;
  filteredCustomers: Company[] = [];
  search(event: Event, type: string) {
    if(type === 'sup'){
      this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
      this.filteredOptions = this.supplierCompanies.filter(option => 
        option.companyName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
        option.code.toString().replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
      );
    }else if(type === 'cust'){
      this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
      this.filteredCustomers = this.customerCompanies.filter(option => 
        option.companyName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
        option.code.toString().replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
      );
    }
  }

  patch(selectedSuggestion: any, type: string) {
    if(type === 'sup') this.piForm.patchValue({ supplierId: selectedSuggestion.id, supplierName: selectedSuggestion.companyName });
    else if(type === 'cust')  this.piForm.patchValue({ customerId: selectedSuggestion.id, customerName: selectedSuggestion.company});
  }

  add(type: string){
    console.log(this.filterValue);
    let name = this.filterValue;
    const dialogRef = this.dialog.open(AddCompanyComponent, {
      data: {type : type, name: name}
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getSuppliers()
    })
  }

  public getCustomers(): void {
    this.companyService.getCustomers().subscribe((customers: any) =>{
      this.customerCompanies = customers
      this.filteredCustomers = this.customerCompanies;
    });
  }

  roleSub!: Subscription;
  roleName!: string;
  sp: boolean = false;
  kamb: boolean = false;
  am: boolean = false;
  ma: boolean = false;
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
      if(this.roleName === 'Sales Executive') this.sp = true;
      if(this.roleName === 'Key Account Manager') this.kamb = true;
      if(this.roleName === 'Manager') this.am = true;
      if(this.roleName === 'Accountant') this.ma = true;
      if(this.roleName === 'Team Lead') this.sp = true;
    })

  }

  kamSub!: Subscription;
  kam: User[] = [];
  getKAM() {
    this.kamSub = this.loginService.getUserByRoleName('Key Account Manager')
      .subscribe(users => {
        this.kam = users;
      });
  }
  amSub!: Subscription;
  AMList: User[] = [];
  getAM(){
    this.amSub = this.loginService.getUserByRoleName('Manager').subscribe(user =>{
      this.AMList = user;
    });
  }

  accountantSub!: Subscription;
  AccountantList: User[] = [];
  getAccountants(){
    this.accountantSub = this.loginService.getUserByRoleName('Accountant').subscribe(user =>{
      this.AccountantList = user;
    });
  }

  piForm = this.fb.group({
    piNo: ['', Validators.required],
    url: this.fb.array([]),
    remarks: [''],
    status: [''],
    kamId: <any>[],
    amId:  <any>[],
    accountantId:  <any>[],
    supplierId: <any>[],
    supplierName: [''],
    supplierPoNo: ['', Validators.required],
    supplierSoNo:[''],
    supplierCurrency:['Dollar'],
    supplierPrice: [, Validators.required],
    purpose: ['', Validators.required],
    customerId: <any>[],
    customerName: [''],
    customerPoNo: [''],
    customerSoNo:[''],
    customerCurrency:['Dollar'],
    poValue: [],
    notes:[''],
    paymentMode: ['WireTransfer']
  });

  doc(): FormArray {
    return this.piForm.get("url") as FormArray;
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

  removeData(index: number) {
    const formGroup = this.doc().at(index).value;
    if (formGroup.url !== null) {
      this.invoiceService.deleteUploadByurl(formGroup.url).subscribe({
        next: (response) => {
          this.doc().removeAt(index)
        },
        error: (error) => {
          console.error('Error during update:', error);
        }
      });
    } else {
      this.doc().removeAt(index)
    }
  }

  imageUploaded: boolean
  isImageUploaded(): boolean {
    const controls = this.piForm.get('url')as FormArray;
    if( controls.length === 0) {return true}
    let i = controls.length - 1;
    if (this.imageUrl[i]) {
      return true;
    }else return false;
  }

  files: File[] = [];
  uploadProgress: number[] = [];
  uploadSuccess: boolean[] = [];

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

        this.uploadSub = this.invoiceService.uploadInvoice(formData).subscribe({
            next: (invoice) => {
                this.doc().at(i).get('url')?.setValue(invoice.fileUrl);
                this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${invoice.fileUrl}`;
            }
        });
    }
  }

  invSub!: Subscription;
  prefix: string = '';
  ivNum: string = '';
  generateInvoiceNumber() {
    this.invSub = this.invoiceService.getPI().subscribe((res: PerformaInvoice[]) => {
      if (res.length > 0) {
        const maxId = res.reduce((prevMax, inv) => {
          const idNumber = parseInt(inv.piNo.replace(/\D/g, ''), 10);
          this.prefix = this.extractLetters(inv.piNo);
          return !isNaN(idNumber) && idNumber > prevMax ? idNumber : prevMax;
        }, 0);

        let nextId = maxId + 1;
        const paddedId = `${this.prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      } else {
        let nextId = 1;
        let prefix = "E-";
        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      }

      this.piForm.get('piNo')?.setValue(this.ivNum);
    });
  }

  extractLetters(input: string): string {
    var extractedChars = input.match(/[A-Za-z-]/g);
    var result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  submit : Subscription
  onSubmit() {
    let submitMethod;
    if (this.roleName === 'Sales Executive') {
        submitMethod = this.invoiceService.addPI(this.piForm.getRawValue());
    } else if (this.roleName === 'Key Account Manager') {
        submitMethod = this.invoiceService.addPIByKAM(this.piForm.getRawValue());
    } else if (this.roleName === 'Manager') {
        submitMethod = this.invoiceService.addPIByAM(this.piForm.getRawValue());
    }

    if (submitMethod) {
        this.submit = submitMethod.subscribe({
            next: (invoice: any) => {
                const piNo = invoice?.piNo;

                if (piNo) {
                    this.snackBar.open(`Proforma Invoice ${piNo} uploaded successfully...`, "", { duration: 3000 });
                    this.router.navigateByUrl('login/viewApproval/view?isSubmitted=true');
                } else {
                    this.snackBar.open('Failed to upload the invoice. Please try again.', "", { duration: 3000 });
                }
            },
            error: (err) => {
                const errorMessage = err?.error?.message || 'An error occurred while uploading the invoice.';
                this.snackBar.open(`Error: ${errorMessage}`, "", { duration: 3000 });
            }
        });
    }
  }

  onDeleteImage(i: number){
    this.invoiceService.deleteUploadByurl(this.imageUrl[i]).subscribe(data=>{
      this.imageUrl[i] = ''
        this.doc().at(i).get('docUrl')?.setValue('');
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    });
  }

  get isCreditCardSelected() {
    return this.piForm.get('paymentMode')?.value === 'CreditCard';
  }
  onPaymentModeChange() {
    this.piForm.get('kamId')?.setValue("")
    this.piForm.get('amId')?.setValue("")
    this.piForm.get('accountantId')?.setValue("")
  }

}
