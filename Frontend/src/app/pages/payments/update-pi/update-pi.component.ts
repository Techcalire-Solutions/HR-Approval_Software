/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, inject, ViewEncapsulation } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
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
import { SafePipe } from '../../../common/safe.pipe';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { AddCompanyComponent } from '../../company/add-company/add-company.component';

@Component({
  selector: 'app-update-pi',
  standalone: true,
  imports: [ ReactiveFormsModule, MatFormFieldModule,  MatCardModule,  MatToolbarModule,  MatButtonModule, MatIconModule,
    MatSelectModule, MatInputModule, SafePipe, CommonModule, MatAutocompleteModule],
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
    supplierId: <any>[],
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

  public supplierCompanies: Company[];
  public customerCompanies: Company[];
  companySub!: Subscription;
  public getSuppliers(): void {
    this.companySub = this.companyService.getSuppliers().subscribe((suppliers: any) =>{
      this.supplierCompanies = suppliers;
      this.fileterdOptions = this.supplierCompanies;
    });
  }

  customerSub!: Subscription;
  public getCustomers(): void {
    this.customerSub = this.companyService.getCustomers().subscribe((customers: any) =>{
      this.customerCompanies = customers;
      this.filteredCustomers = this.customerCompanies;
    });
  }

  filterValue: string;
  filteredCustomers: Company[] = [];
  fileterdOptions: Company[] = [];
  search(event: Event, type: string) {
    if(type === 'sup'){
      this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
      this.fileterdOptions = this.supplierCompanies.filter(option => 
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

  private dialog = inject(MatDialog);
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
        this.newImageUrl.splice(index, 1); 
    } else {
        console.warn(`Index ${index} is out of bounds for removal`);
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
    const user = JSON.parse(token)

    const roleId = user.role
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
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png', 'plain'];
  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    const file: any = input.files?.[0];
    const fileType = file.type.split('/')[1]
    if (!this.allowedFileTypes.includes(fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, TXT or PNG file.');
      return;
    }
    if (file) {
        const inv = this.piNo;
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
    const extractedChars = input.match(/[A-Za-z-]/g);
    const result = extractedChars ? extractedChars.join('') : '';
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
                  const piNo = invoice?.piNo;

                  if (piNo) {
                      this.snackBar.open(`Proforma Invoice ${piNo} Updated successfully...`, "", { duration: 3000 });
                      this.router.navigateByUrl('login/viewApproval/view');
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
      const inv = pi.pi;
      this.piNo = inv.piNo
      console.log(inv);
      
      const remarks = inv.performaInvoiceStatuses.find((s:any) => s.status === inv.status)?.remarks;
      this.piForm.patchValue({
        piNo: inv.piNo,
        status: inv.status,
        remarks: remarks,
        kamId: inv.kamId,
        amId: inv.amId,
        accountantId: inv.accountantId,
        supplierId: inv.supplierId,
        supplierName: inv.suppliers.companyName,
        supplierSoNo: inv.supplierSoNo,
        supplierPoNo: inv.supplierPoNo,
        supplierPrice: inv.supplierPrice,
        purpose: inv.purpose,
        customerId: inv.customerId,
        customerName: inv.customers.companyName,
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
    this.deleteSub = this.invoiceService.deleteUploaded(this.route.snapshot.params['id'], i).subscribe(()=>{
      this.newImageUrl[i] = '';
      this.imageUrl[i] = '';
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
      this.isImageUploaded()
    });
  }

  deleteImageSub!: Subscription;
  onDeleteImage(i: number){
    this.deleteImageSub = this.invoiceService.deleteUploadByurl(this.newImageUrl[i]).subscribe(()=>{
      this.newImageUrl[i] = ''
      this.imageUrl[i] = ''
        this.doc().at(i).get('docUrl')?.setValue('');
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    });
  }

  imageUploaded: boolean
  isImageUploaded(): boolean {
    const controls = this.piForm.get('url')as FormArray;
    if( controls.length === 0) { return true}
    const i = controls.length - 1;
    if (this.imageUrl[i] || this.newImageUrl[i]) {
      return true;
    }else return false;
  }

  onPaymentModeChange() {
    this.piForm.get('kamId')?.setValue("")
    this.piForm.get('amId')?.setValue("")
    this.piForm.get('accountantId')?.setValue("")
  }
}
