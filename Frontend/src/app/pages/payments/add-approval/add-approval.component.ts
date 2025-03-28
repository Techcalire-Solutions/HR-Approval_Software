/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
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
import { SafePipe } from '../../../common/pipes/safe.pipe';
import { InvoiceService } from '@services/invoice.service';
import { environment } from '../../../../environments/environment';
import { Company } from '../../../common/interfaces/company';
import { PerformaInvoice } from '../../../common/interfaces/payments/performaInvoice';
import { AddCompanyComponent } from '../../company/add-company/add-company.component';
import { User } from '../../../common/interfaces/users/user';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-add-approval',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatCardModule, MatToolbarModule, MatIconModule, MatButtonModule,
    MatSelectModule, MatInputModule, SafePipe, CommonModule, MatAutocompleteModule, MatProgressSpinnerModule],
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
    const token: any = localStorage.getItem('token');
    const user = JSON.parse(token)

    const roleId = user.role
    this.getRoleById(roleId)
    this.addDoc()
  }
  
  get isCustomerSelected(): boolean {
    const purposeValue: any = this.piForm.get('purpose')?.value;
    return Array.isArray(purposeValue) && purposeValue.includes('Customer');
  }

  id!: number;
  supplierCompanies: Company[] = [];
  public customerCompanies: Company[] = [];
  public filteredOptions: Company[] = [];
  public getSuppliers(): void {
    this.companyService.getSuppliers().subscribe((suppliers: Company[]) => {
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

  patch(selectedSuggestion: Company, type: string) {
    if(type === 'sup') this.piForm.patchValue({ supplierId: selectedSuggestion.id, supplierName: selectedSuggestion.companyName });
    else if(type === 'cust')  this.piForm.patchValue({ customerId: selectedSuggestion.id, customerName: selectedSuggestion.companyName});
  }

  add(type: string){
    const name = this.filterValue;
    const dialogRef = this.dialog.open(AddCompanyComponent, {
      data: {type : type, name: name}
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getSuppliers()
      this.getCustomers()
    })
  }

  public getCustomers(): void {
    this.companyService.getCustomers().subscribe((customers: Company[]) =>{
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
    supplierId: <any>['', Validators.required],
    supplierName: [''],
    supplierPoNo: ['', Validators.required],
    supplierSoNo:[''],
    supplierCurrency:['Dollar'],
    supplierPrice: [Validators.required],
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
    } 
  }

  imageUploaded: boolean
  isImageUploaded(): boolean {
    const controls = this.piForm.get('url')as FormArray;
    if( controls.length === 0) {return true}
    const i = controls.length - 1;
    if (this.imageUrl[i]) {
      return true;
    }else return false;
  }

  files: File[] = [];
  uploadProgress: number[] = [];
  uploadSuccess: boolean[] = [];

  uploadSub!: Subscription;
  imageUrl: string[] = [];
  fileType: string[] = [];
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png', 'plain'];
  // onFileSelected(event: any, i: number): void {
  //   const input = event.target as HTMLInputElement;
  //   const file: any = input.files?.[0];
  //   this.fileType[i] = file.type.split('/')[1]
  //   console.log(this.fileType[i]);
    
  //   if (!this.allowedFileTypes.includes(this.fileType[i])) {
  //     alert('Invalid file type. Please select a PDF, JPEG, JPG, TXT or PNG file.');
  //     return;
  //   }
  //   if (file) {
  //       const inv = this.ivNum;
  //       const name = `${inv}_${i}`;
  //       const formData = new FormData();
  //       formData.append('file', file);
  //       formData.append('name', name);

  //       this.uploadSub = this.invoiceService.uploadInvoice(formData).subscribe({
  //           next: (invoice) => {

  //               this.doc().at(i).get('url')?.setValue(invoice.fileUrl);
  //               this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${invoice.fileUrl}`;
  //           }
  //       });
  //   }
  // }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDropped(event: DragEvent, i: number): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0], i);
    }
  }

  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file, i);
    }
  }

  processFile(file: File, i: number): void {
    this.fileType[i] = file.type.split('/')[1];
    if (!this.allowedFileTypes.includes(this.fileType[i])) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, TXT, or PNG file.');
      return;
    }

    const inv = this.ivNum; 
    const name = `${inv}_${i}`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    this.uploadSub = this.invoiceService.uploadInvoice(formData).subscribe({
      next: (invoice) => {
        this.doc().at(i).get('url')?.setValue(invoice.fileUrl);
        this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${invoice.fileUrl}`;
      },
      error: () => {
        alert('File upload failed. Please try again.');
      },
    });
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

        const nextId = maxId + 1;
        const paddedId = `${this.prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      } else {
        const nextId = 1;
        const prefix = "E-";
        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;
        this.ivNum = paddedId;
      }

      this.piForm.get('piNo')?.setValue(this.ivNum);
    });
  }

  extractLetters(input: string): string {
    const extractedChars = input.match(/[A-Za-z-]/g);
    const result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  submit : Subscription
  submitted: boolean = false;
  onSubmit() {
    this.submitted = true;
    let submitMethod;
    if (this.roleName === 'Sales Executive' || this.roleName === 'Team Lead') {
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
                    this.submitted = false;
                    this.router.navigateByUrl('login/viewApproval/view?isSubmitted=true');
                } else {
                    this.snackBar.open('Failed to upload the invoice. Please try again.', "", { duration: 3000 });
                }
            },
            error: (err) => {
                const errorMessage = err?.error?.message || 'An error occurred while uploading the invoice.';
                this.submitted = false;
                this.snackBar.open(`Error: ${errorMessage}`, "", { duration: 3000 });
            }
        });
    }
  }

  onDeleteImage(i: number){
    this.invoiceService.deleteUploadByurl(this.imageUrl[i]).subscribe(()=>{
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
