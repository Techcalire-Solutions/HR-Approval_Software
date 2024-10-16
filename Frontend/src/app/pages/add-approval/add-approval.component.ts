import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceService } from '@services/invoice.service';
import { PerformaInvoice } from '../../common/interfaces/performaInvoice';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../../common/interfaces/user';
import { SafePipe } from "./view-invoices/safe.pipe";
import { Company } from '../../common/interfaces/company';
import { CompanyService } from '@services/company.service';
@Component({
  selector: 'app-add-approval',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule, SafePipe],
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

  id!: number;
  public companies: Company[] | null;
  public supplierCompanies: Company[] | null;
  public customerCompanies: Company[] | null;
  ngOnInit(): void {
    this.getCompany();
    this.getSuppliers()
    this.getCustomers()
    this.generateInvoiceNumber()
    this.id = this.route.snapshot.params['id'];
    if(this.id){
      this.patchdata(this.id);
    }
    this.getKAM();
    this.getAM();
    this.getAccountants();

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }
  
  public getCompany(): void {
 
    this.companyService.getCompany().subscribe((companies: any) =>{
      this.companies = companies
    });
  }
   public getSuppliers(): void {
  
    this.companyService.getSuppliers().subscribe((suppliers: any) =>{
      this.supplierCompanies = suppliers
    });
  }
  public getCustomers(): void {
  
    this.companyService.getCustomers().subscribe((customers: any) =>{
      this.customerCompanies = customers
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
  getKAM(){
    this.kamSub = this.loginService.getUserByRole(2).subscribe(user =>{
      this.kam = user;
    });
  }
  amSub!: Subscription;
  AMList: User[] = [];
  getAM(){
    this.amSub = this.loginService.getUserByRole(3).subscribe(user =>{
      this.AMList = user;
    });
  }

  accountantSub!: Subscription;
  AccountantList: User[] = [];
  getAccountants(){
    this.accountantSub = this.loginService.getUserByRole(4).subscribe(user =>{
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
    supplierName: ['', Validators.required],
    supplierPoNo: ['', Validators.required],
    supplierSoNo:[''],
    supplierCurrency:['Dollar'],
    supplierPrice: ['', Validators.required],
    purpose: ['', Validators.required],
    customerName: [''],
    customerPoNo: [''],
    customerSoNo:[''],
    customerCurrency:['Dollar'],
    poValue: ['']
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
    console.log(controls.length);
    let i = controls.length - 1;
    if (this.imageUrl[i]) {
      console.log(this.imageUrl[i]);
      
      return true;
    }else return false;
  }

  @ViewChild('form') form!: ElementRef<HTMLFormElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('progressArea') progressArea!: ElementRef<HTMLElement>;
  @ViewChild('uploadArea') uploadArea!: ElementRef<HTMLElement>;
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

  submit!: Subscription;
  onSubmit(){
    if(this.roleName=='Sales Executive'){
      console.log(this.piForm.getRawValue());
      this.submit = this.invoiceService.addPI(this.piForm.getRawValue()).subscribe((invoice: any) =>{
        console.log(invoice);
        
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval?isSubmitted=true')
      });
    } else if(this.roleName=='Key Account Manager'){
      this.submit = this.invoiceService.addPIByKAM(this.piForm.getRawValue()).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval?isSubmitted=true')
      });
    }
    else if(this.roleName=='Manager'){
      this.submit = this.invoiceService.addPIByAM(this.piForm.getRawValue()).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval?isSubmitted=true')
      });
    }

  }

  piSub!: Subscription;
  editStatus: boolean = false;
  fileName!: string;
  patchdata(id: number){
    this.editStatus = true;
    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      let inv = pi.pi;
      this.fileName = inv.url
      let remarks = inv.performaInvoiceStatuses.find((s:any) => s.status === inv.status)?.remarks;
      this.piForm.patchValue({piNo: inv.piNo, status: inv.status, remarks: remarks, kamId: inv.kamId,  supplierName:inv.supplierName,supplierPoNo: inv.supplierPoNo,
        supplierPrice:inv.supplierPrice ,
        purpose:inv.purpose,
        customerName:inv.customerName ,
        customerPoNo: inv.customerPoNo,
        poValue:inv.poValue})
      if(inv.url != '') this.imageUrl = pi.signedUrl;

    });
  }

  clearFileInput() {
    let file = this.fileName
    let id = this.id
  }

  onDeleteImage(i: number){
    this.invoiceService.deleteUploadByurl(this.imageUrl[i]).subscribe(data=>{
      this.imageUrl[i] = ''
        this.doc().at(i).get('docUrl')?.setValue('');
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    });
  }
}
