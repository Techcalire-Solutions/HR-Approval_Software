import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InvoiceService } from '@services/invoice.service';
import { PerformaInvoice } from '../../common/interfaces/performaInvoice';
import { CommonModule } from '@angular/common';
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
@Component({
  selector: 'app-add-approval',
  standalone: true,
  imports: [CommonModule,
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

  constructor(private dialog: MatDialog,private invoiceService: InvoiceService, private fb: FormBuilder, private snackBar: MatSnackBar, private router: Router,
    private route: ActivatedRoute, private loginServie: LoginService, private sanitizer: DomSanitizer
  ){

  }

  ngOnDestroy(): void {
    this.invSub?.unsubscribe();
    this.uploadSub?.unsubscribe();
    this.submit?.unsubscribe();
  }

  id!: number;
  ngOnInit(): void {
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
    this.kamSub = this.loginServie.getUserByRole(2).subscribe(user =>{
      this.kam = user;
    });
  }
  amSub!: Subscription;
  AMList: User[] = [];
  getAM(){
    this.amSub = this.loginServie.getUserByRole(3).subscribe(user =>{
      this.AMList = user;
    });
  }

  accountantSub!: Subscription;
  AccountantList: User[] = [];
  getAccountants(){
    this.accountantSub = this.loginServie.getUserByRole(4).subscribe(user =>{
      this.AccountantList = user;
      console.log('account list',this.AccountantList);

    });
  }

  piForm = this.fb.group({
    piNo: ['', Validators.required],
    url: ['', Validators.required],
    remarks: [''],
    status: [''],
    kamId: <any>[],
    amId:  <any>[],
    accountantId:  <any>[],
    supplierName: ['', Validators.required],
    supplierPoNo: ['', Validators.required],
    supplierCurrency:['Dollar'],
    supplierPrice: ['', Validators.required],
    purpose: ['', Validators.required],
    customerName: [''],
    customerPoNo: [''],
    customerCurrency:['Dollar'],
    poValue: ['']
  });

  @ViewChild('form') form!: ElementRef<HTMLFormElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('progressArea') progressArea!: ElementRef<HTMLElement>;
  @ViewChild('uploadArea') uploadArea!: ElementRef<HTMLElement>;

  // ngAfterViewInit() {
  //   this.form.nativeElement.addEventListener('click', () => {
  //     this.fileInput.nativeElement.click();
  //   });

  //   this.fileInput.nativeElement.addEventListener('change', (e: Event) => {
  //     this.uploadFile(e)
  //   });
  // }

  uploadProgress: number | null = null;
  uploadComplete: boolean = false;
  file!: any;
  uploadSub!: Subscription;
  fileType: string = '';
  imageUrl!: string;
  public safeUrl!: SafeResourceUrl;
  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.fileType = this.file.type.split('/')[1];
    if (this.file) {
      this.uploadComplete = false; // Set to false to show the progress bar

      let fileName = this.file.name;
      if (fileName.length > 12) {
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "... ." + splitName[1];
      }
      this.uploadSub = this.invoiceService.uploadInvoice(this.file).subscribe({
        next: (invoice) => {
          this.imageUrl = invoice.fileUrl;
          this.piForm.get('url')?.setValue(invoice.fileUrl);
          this.uploadComplete = true;
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.uploadComplete = true;
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
    // return input.replace(/[^a-zA-Z]/g, "");
    var extractedChars = input.match(/[A-Za-z-]/g);

    // Combine the matched characters into a string
    var result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  submit!: Subscription;
  onSubmit(){
    if(this.roleName=='Sales Executive'){
      this.submit = this.invoiceService.addPI(this.piForm.getRawValue()).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval')
      });
    } else if(this.roleName=='Key Account Manager'){
      this.submit = this.invoiceService.addPIByKAM(this.piForm.getRawValue()).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval')
      });
    }
    else if(this.roleName=='Manager'){
      this.submit = this.invoiceService.addPIByAM(this.piForm.getRawValue()).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval')
      });
    }

  }

  onUpdate(){
    if(this.roleName=='Sales Executive'){
    this.submit = this.invoiceService.updatePIBySE(this.piForm.getRawValue(), this.id).subscribe((invoice: any) =>{

      this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Updated succesfully...`,"" ,{duration:3000})
      this.router.navigateByUrl('login/viewApproval')
    });
  }else if(this.roleName=='Key Account Manager'){
    this.submit = this.invoiceService.updatePIByKAM(this.piForm.getRawValue(), this.id).subscribe((invoice: any) =>{

      this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Updated succesfully...`,"" ,{duration:3000})
      this.router.navigateByUrl('login/viewApproval')
    });
  }

  else if(this.roleName=='Manager'){
    this.submit = this.invoiceService.updatePIByAM(this.piForm.getRawValue(), this.id).subscribe((invoice: any) =>{

      this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Updated succesfully...`,"" ,{duration:3000})
      this.router.navigateByUrl('login/viewApproval')
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
}
