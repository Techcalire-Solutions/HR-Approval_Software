import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { SafePipe } from '../view-invoices/safe.pipe';

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
import { User } from '../../../common/interfaces/user';
@Component({
  selector: 'app-update-pi',
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
    MatProgressSpinnerModule,
    SafePipe],
  templateUrl: './update-pi.component.html',
  styleUrl: './update-pi.component.scss'
})
export class UpdatePIComponent {
  url = environment.apiUrl;

  constructor(private invoiceService: InvoiceService, private fb: FormBuilder, private snackBar: MatSnackBar, private router: Router,
    private route: ActivatedRoute, private loginServie: LoginService, private sanitizer: DomSanitizer
  ){}
  getPiById(id: number){
    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      console.log(pi);

      // this.pi = pi;
      // this.piNo = pi.piNo;
      this.url = environment.apiUrl + pi.url;
      // if(pi.bankSlip != null) this.bankSlip = environment.apiUrl + pi.bankSlip;
      // this.getPiStatusByPiId(id)
    });
  }
  ngOnDestroy(): void {
    this.invSub?.unsubscribe();
    this.uploadSub?.unsubscribe();
    // this.submit?.unsubscribe();
  }
  piForm: FormGroup;
  id!: number;
  ngOnInit(): void {
    this.piForm = this.fb.group({
      piNo: [''],
      url: [],
      remarks: [''],
      status: [''],
      kamId: <any>[],
      supplierName: [''],
      supplierPoNo: [''],
      supplierPrice: [''],
      purpose: [''],
      customerName: [''],
      customerPoNo: [''],
      poValue: ['']

    });

    // this.generateInvoiceNumber()
    this.id = this.route.snapshot.params['id'];
    if(this.id){
      this.patchdata(this.id);
    }
    this.getKAM();

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }

  kamSub!: Subscription;
  kam: User[] = [];
  getKAM(){
    this.kamSub = this.loginServie.getUserByRole(2).subscribe(user =>{
      this.kam = user;
    });
  }



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
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ invoice.fileUrl}`;
          if (this.imageUrl) {
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.imageUrl);
          }
          this.piForm.get('url')?.setValue(invoice.fileUrl);
          this.uploadComplete = true; // Set to true when upload is complete
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.uploadComplete = true; // Set to true to remove the progress bar even on error
        }
      });
    }
  }

  invSub!: Subscription;
  prefix: string = '';
  ivNum: string = '';
  generateInvoiceNumber() {
    this.invSub = this.invoiceService.getPI().subscribe((res: PerformaInvoice[]) => {
      // Check if there are any employees in the array
      if (res.length > 0) {
        const maxId: any = res.reduce((prevMax, inv) => {
          // Extract the numeric part of the employee ID and convert it to a number
          const idNumber = parseInt(inv.piNo.replace(/\D/g, ''), 10);

          this.prefix = this.extractLetters(inv.piNo);

          // Check if the extracted numeric part is a valid number
          if (!isNaN(idNumber)) {
            return idNumber > prevMax ? idNumber : prevMax;
          } else {
            // If the extracted part is not a valid number, return the previous max
            return prevMax;
          }
        }, 0);
        // Increment the maxId by 1 to get the next ID


          let nextId = maxId + 1;
          const paddedId = `${this.prefix}${nextId.toString().padStart(3, "0")}`;

          this.ivNum = paddedId;

          this.piForm.get('piNo')?.setValue(this.ivNum);
      } else {
        // If there are no employees in the array, set the employeeId to 'EMP001'
        let nextId = 0o1;
        let prefix = "PI-";
        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        this.ivNum = paddedId;

        this.piForm.get('piNo')?.setValue(this.ivNum);
      }
    });
  }

  extractLetters(input: string): string {
    // return input.replace(/[^a-zA-Z]/g, "");
    var extractedChars = input.match(/[A-Za-z-]/g);

    // Combine the matched characters into a string
    var result = extractedChars ? extractedChars.join('') : '';

    return result;
  }

  // submit!: Subscription;
  // onSubmit(){
  //   this.submit = this.invoiceService.addPI(this.piForm.getRawValue()).subscribe((invoice: any) =>{
  //     this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
  //     this.router.navigateByUrl('login/viewApproval')
  //   });
  // }
  roleName!: string;
  roleSub!: Subscription;
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

  submit!: Subscription;
  onUpdate(){
    console.log(this.roleName);

    if(this.roleName=='Sales Executive'){
      this.submit = this.invoiceService.updatePIBySE(this.piForm.getRawValue(), this.id).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval')
      });
    }else if(this.roleName=='Key Account Manager'){
      this.submit = this.invoiceService.updatePIByKAM(this.piForm.getRawValue(), this.id).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval')
      });
    }

    else if(this.roleName=='Manager'){
      this.submit = this.invoiceService.updatePIByAM(this.piForm.getRawValue(), this.id).subscribe((invoice: any) =>{
        this.snackBar.open(`Performa Invoice ${invoice.p.piNo} Uploaded succesfully...`,"" ,{duration:3000})
        this.router.navigateByUrl('login/viewApproval')
      });
    }
  }

  piSub!: Subscription;
  editStatus: boolean = false;
  fileName!: string;
  patchdata(id: number) {
    this.editStatus = true;
    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      let inv = pi.pi;
      let remarks = inv.performaInvoiceStatuses.find((s:any) => s.status === inv.status)?.remarks;

      // Patch the form values without `url`
      this.piForm.patchValue({
        piNo: inv.piNo,
        status: inv.status,
        remarks: remarks,
        kamId: inv.kamId,
        supplierName: inv.supplierName,
        supplierPoNo: inv.supplierPoNo,
        supplierPrice: inv.supplierPrice,
        purpose: inv.purpose,
        customerName: inv.customerName,
        customerPoNo: inv.customerPoNo,
        poValue: inv.poValue,
        url: inv.url
      });
      // Update imageUrl based on `inv.url`
      if (inv.url) {
        this.imageUrl = pi.signedUrl;
      } else {
        this.imageUrl = ''; // Clear imageUrl if inv.url is empty
      }
    });
  }


  clearFileInput() {
    let file = this.fileName
    let id = this.id

  }
}
