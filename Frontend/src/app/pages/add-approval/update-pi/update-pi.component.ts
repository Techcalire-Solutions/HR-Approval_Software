import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SafePipe } from '../view-invoices/safe.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { User } from '../../../common/interfaces/user';
import { MatIconModule } from '@angular/material/icon';
import { Company } from '../../../common/interfaces/company';
import { CompanyService } from '@services/company.service';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-update-pi',
  standalone: true,
  imports: [ ReactiveFormsModule, MatFormFieldModule,  MatCardModule,  MatToolbarModule,  MatButtonModule, MatIconModule,
    MatSelectModule, MatInputModule, SafePipe],
  templateUrl: './update-pi.component.html',
  styleUrl: './update-pi.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class UpdatePIComponent {
  url = environment.apiUrl;

  invoiceService =inject(InvoiceService)
  loginService = inject(LoginService)
  fb=inject(FormBuilder)
  snackBar=inject(MatSnackBar)
  router= inject(Router)
  route= inject(ActivatedRoute)

  sanitizer=inject(DomSanitizer)
  companyService=inject(CompanyService)

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.upload?.unsubscribe();
    this.deleteImageSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
    this.piSub?.unsubscribe();
    this.kamSub?.unsubscribe();
    this.amSub?.unsubscribe();
    this.accountantSub?.unsubscribe();
    this.companySub?.unsubscribe();
    this.customerSub?.unsubscribe();
    this.deleteUploadSub?.unsubscribe();
    this.roleSub?.unsubscribe();
  }

  piForm = this.fb.group({
    piNo: ['', Validators.required],
    url: this.fb.array([]),
    remarks: [''],
    status: [''],
    kamId: <any>[],
    amId:  <any>[],
    accountantId:  <any>[],
    supplierId: ['', Validators.required],
    supplierPoNo: ['', Validators.required],
    supplierSoNo:[''],
    supplierCurrency:['Dollar'],
    supplierPrice: ['', Validators.required],
    purpose: ['', Validators.required],
    customerId: [''],
    customerPoNo: [''],
    customerSoNo:[''],
    customerCurrency:['Dollar'],
    poValue: [''],
    notes:[],
    paymentMode:['']
  });

  public supplierCompanies: Company[] | null;
  public customerCompanies: Company[] | null;
  companySub!: Subscription;
  public getSuppliers(): void {
    this.companySub = this.companyService.getSuppliers().subscribe((suppliers: any) =>{
      this.supplierCompanies = suppliers;
    });
  }

  customerSub!: Subscription;
  public getCustomers(): void {
    this.customerSub = this.companyService.getCustomers().subscribe((customers: any) =>{
      this.customerCompanies = customers
    });
  }
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
      url: [initialValue?initialValue.url : '', Validators.required],
      remarks: [initialValue?initialValue.remarks : ''],
    });
  }

  deleteUploadSub!: Subscription;
  removeData(index: number) {
    const formGroup = this.doc().at(index).value;
    if (formGroup.url !== null) {
      this.deleteUploadSub = this.invoiceService.deleteUploadByurl(formGroup.url).subscribe({
        next: (response) => {
          const control = this.doc().at(index).get('url');
          if (control) {
            control.setValue('');
            this.imageUrl[index] = '';
            this.newImageUrl[index] = '';
          }
          this.doc().removeAt(index);
        },
        error: (error) => {
          console.error('Error during update:', error);
        }
      });
    } else {
      this.doc().removeAt(index);
    }
  }


  id!: number;
  ngOnInit(): void {
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
    this.getSuppliers();
    this.getCustomers()
  }

  kamSub!: Subscription;
  kam: User[] = [];
  getKAM(){
    this.kamSub = this.loginService.getUserByRoleName('Key Account Manager').subscribe(user =>{
      this.kam = user;
    });
  }

  fileType: any[] = [];
  uploadSub!: Subscription;
  imageUrl: any[] = [];
  newImageUrl: any[] = [];
  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    let file: any = input.files?.[0];

    this.fileType[i] = file.type.split('/')[1]
    if (file) {
        let inv = this.piNo;
        const name = `${inv}_${i}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);

        this.uploadSub = this.invoiceService.uploadInvoice(formData).subscribe({
            next: (invoice) => {
                this.doc().at(i).get('url')?.setValue(invoice.fileUrl);
                this.newImageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${invoice.fileUrl}`;
            }
        });
    }
  }

  extractLetters(input: string): string {
    var extractedChars = input.match(/[A-Za-z-]/g);
    var result = extractedChars ? extractedChars.join('') : '';
    return result;
  }

  roleName!: string;
  roleSub!: Subscription;
  sp: boolean = false;
  kamb: boolean = false;
  am: boolean = false;
  ma: boolean = false;
  admin: boolean =false;
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
      if(this.roleName === 'Sales Executive') this.sp = true;
      if(this.roleName === 'Key Account Manager') this.kamb = true;
      if(this.roleName === 'Manager') this.am = true;
      if(this.roleName === 'Accountant') this.ma = true;
      if(this.roleName === 'Team Lead') this.sp = true;
      if(this.roleName === 'Administrator'||this.roleName === 'Super Administrator') this.admin = true;

    })
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


  upload!: Subscription;

  onUpdate() {
      let updateMethod;

      if (this.roleName === 'Sales Executive') {
        updateMethod = this.invoiceService.updatePIBySE(this.piForm.getRawValue(), this.id);
      } else if (this.roleName === 'Key Account Manager') {
        updateMethod = this.invoiceService.updatePIByKAM(this.piForm.getRawValue(), this.id);
      } else if (this.roleName === 'Manager') {
        updateMethod = this.invoiceService.updatePIByAM(this.piForm.getRawValue(), this.id);
      } else if (this.roleName === 'Administrator' || this.roleName === 'Super Administrator') {
        updateMethod = this.invoiceService.updatePIByAdminSuperAdmin(this.piForm.getRawValue(), this.id);
      }

      if (updateMethod) {
          if (this.upload) {
              this.upload.unsubscribe();
          }


          this.upload = updateMethod.subscribe({
              next: (invoice: any) => {
                console.log(invoice)
                  const piNo = invoice?.piNo;

                  if (piNo) {
                      this.snackBar.open(`Proforma Invoice ${piNo} Updated successfully...`, "", { duration: 3000 });
                      this.router.navigateByUrl('login/viewApproval');
                  } else {
                      this.snackBar.open('Failed to update the invoice. Please try again.', "", { duration: 3000 });
                  }
              },
              error: (err) => {
                  const errorMessage = err?.error?.message || 'An error occurred while updating the invoice. Please try again.';
                  this.snackBar.open(`Error: ${errorMessage}`, "", { duration: 3000 });
              }
          });
      }
  }


  piSub!: Subscription;
  editStatus: boolean = false;
  fileName!: string;
  piNo: string;
  patchdata(id: number) {
    this.editStatus = true;
    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      let inv = pi.pi;
      this.piNo = inv.piNo
      let remarks = inv.performaInvoiceStatuses.find((s:any) => s.status === inv.status)?.remarks;
      this.piForm.patchValue({
        piNo: inv.piNo,
        status: inv.status,
        remarks: remarks,
        kamId: inv.kamId,
        amId: inv.amId,
        accountantId: inv.accountantId,
        supplierId: inv.supplierId,
        supplierSoNo: inv.supplierSoNo,
        supplierPoNo: inv.supplierPoNo,
        supplierPrice: inv.supplierPrice,
        purpose: inv.purpose,
        customerId: inv.customerId,
        customerPoNo: inv.customerPoNo,
        customerSoNo: inv.customerSoNo,
        poValue: inv.poValue,
        notes: inv.notes,
        paymentMode: inv.paymentMode
      });

      for (let index = 0; index < pi.signedUrl.length; index++) {
        this.addDoc(pi.pi.url[index])
      }
      if (inv.url) {
        this.imageUrl = pi.signedUrl;
      }
    });
  }

  deleteSub!: Subscription;
  onDeleteUploadedImage(i: number){
    this.deleteSub = this.invoiceService.deleteUploaded(this.route.snapshot.params['id'], i).subscribe(data=>{
      this.newImageUrl[i] = '';
      this.imageUrl[i] = '';
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
      this.isImageUploaded()
    });
  }

  deleteImageSub!: Subscription;
  onDeleteImage(i: number){
    this.deleteImageSub = this.invoiceService.deleteUploadByurl(this.newImageUrl[i]).subscribe(data=>{
      this.newImageUrl[i] = ''
        this.doc().at(i).get('docUrl')?.setValue('');
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    });
  }

  imageUploaded: boolean
  isImageUploaded(): boolean {
    const controls = this.piForm.get('url')as FormArray;

    if( controls.length === 0) {return true;}
    let i = controls.length - 1;
    if (this.imageUrl[i] || this.newImageUrl[i]) {
      return true;
    }else return false;
  }

  onPaymentModeChange() {
    console.log("kkkkkkkkkkkkk");
    
    this.piForm.get('kamId')?.setValue("")
    this.piForm.get('amId')?.setValue("")
    this.piForm.get('accountantId')?.setValue("")
  }
}
