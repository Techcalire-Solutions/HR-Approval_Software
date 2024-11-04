import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PerformaInvoiceStatus } from '../../../../common/interfaces/performa-invoice-status';
import { BankReceiptDialogueComponent } from '../bank-receipt-dialogue/bank-receipt-dialogue.component';
import { VerificationDialogueComponent } from '../verification-dialogue/verification-dialogue.component';
import { SafePipe } from '../../../../common/safe.pipe';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-view-invoices',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule,
    RouterModule, MatTabGroup, MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    SafePipe,
    MatProgressSpinnerModule, MatFormFieldModule, ReactiveFormsModule,UpperCasePipe,DatePipe
  ],
  templateUrl: './view-invoices.component.html',
  styleUrl: './view-invoices.component.scss'
})
export class ViewInvoicesComponent {
  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.piSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
    this.verifiedSub?.unsubscribe();
    this.excelSub?.unsubscribe();
  }
  invoiceService=inject(InvoiceService)
  loginService=inject(LoginService)
  snackBar=inject(MatSnackBar)
  router=inject(Router)
  route=inject(ActivatedRoute)
  dialog=inject(MatDialog)
  userId: number

  formatNotes(notes: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g; // Regex to match URLs
    return notes.replace(urlRegex, (url) => 
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
  }
  
  formatRemarks(remarks: string | null | undefined): string {
    if (!remarks) return ''; // Handle null or undefined values gracefully
  
    const urlRegex = /(https?:\/\/[^\s]+)/g; // Regex to match URLs
    return remarks.replace(urlRegex, (url) => 
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
  }
  
  ngOnInit(): void {
    let id = this.route.snapshot.params['id'];

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    this.userId = user.id;

    let roleId = user.role
    this.getRoleById(roleId, id)
  }

  roleSub!: Subscription;
  roleName!: string;
  sp: boolean = false;
  kam: boolean = false;
  am: boolean = false;
  ma: boolean = false;
  admin: boolean = false;
  teamLead: boolean = false;
  getRoleById(id: number, piId: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
      this.getPiById(piId)

      if(this.roleName === 'Sales Executive') this.sp = true;
      if(this.roleName === 'Key Account Manager') this.kam = true;
      if(this.roleName === 'Manager') this.am = true;
      if(this.roleName === 'Accountant') this.ma = true;
      if(this.roleName === 'Administrator') { this.admin = true }
     if(this.roleName === 'Team Lead') { this.teamLead = true }
    })
  }
  
  encodeUrl(url: string): string {
    return encodeURIComponent(url);
  }

  piSub!: Subscription;
  url!: string;
  piNo!: string;
  pi!: any;
  bankSlip!: string;
  signedUrl: any[];
  getPiById(id: number){
    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      this.pi = pi.pi;
      this.piNo = pi.pi.piNo;

      const signedUrlsWithType = pi.signedUrl.map((signedUrl: any) => {
        const url = signedUrl.url;
        const fileType = url.split('.').pop().split('?')[0]; 
        return {
            url: url,
            type: fileType,
            remarks: signedUrl.remarks 
        };
      });
      
      this.signedUrl = signedUrlsWithType;
      
      if( (this.pi.status === 'GENERATED' ) && this.roleName === 'Key Account Manager' ){
        this.pi = {
          ...this.pi,
          approveButtonStatus: true
        };
      }else if( (this.pi.status === 'INITIATED' || this.pi.status === 'KAM VERIFIED' )&& this.roleName === 'Manager' ){
        this.pi = {
          ...this.pi,
          approveButtonStatus: true
        };
      }
      if(pi.pi.bankSlip != null) this.bankSlip = pi.bankSlip;

      this.getPiStatusByPiId(id)
    });
  }
  filterValue: string
  statusSub!: Subscription;
  status: PerformaInvoiceStatus[] = [];
  getPiStatusByPiId(id: number){
    this.statusSub = this.invoiceService.getPIStatusByPIId(id, this.filterValue).subscribe(status => {
      this.status = status;
    });
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    this.getPiById(this.route.snapshot.params['id'])
  }

  dialogSub!: Subscription;
  submittingForm: boolean = false;
  verifiedSub: Subscription
  verified(value: string, piNo: string, sp: string, id: number, stat: string){
    let status = this.pi.status;
    this.submittingForm = true;
    if(stat === 'INITIATED' && value === 'approved') status = 'AM APPROVED';
    else if(stat === 'INITIATED' && value === 'rejected') status = 'AM REJECTED';
    if(status === 'GENERATED' && value === 'approved') status = 'KAM VERIFIED';
    else if(status === 'GENERATED' && value === 'rejected') status = 'KAM REJECTED';
    else if(status === 'KAM VERIFIED' && value === 'approved') status = 'AM VERIFIED';
    else if(status === 'KAM VERIFIED' && value === 'rejected') status = 'AM REJECTED';

    const dialogRef = this.dialog.open(VerificationDialogueComponent, {
      data: { invoiceNo: piNo, status: status, sp: sp }
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.submittingForm = true;
        let data = {
          status: status,
          performaInvoiceId: id,
          remarks: result.remarks,
          kamId: result.kamId,
          amId: result.amId,
          accountantId: result.accountantId
        }

        this.verifiedSub = this.invoiceService.updatePIStatus(data).subscribe(result => {
          this.submittingForm = false;
          this.getPiById(id)
          this.snackBar.open(`Invoice ${piNo} updated to ${status}...`,"" ,{duration:3000})
          this.router.navigateByUrl('login/viewApproval/view')
        });
      }
    })
  }

  addBankSlip(piNo: string, id: number, status: string){
    const dialogRef = this.dialog.open(BankReceiptDialogueComponent, {
      data: { invoiceNo: piNo, id: id, status: status }
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getPiById(id)
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
      }
    })
  }

  fileName: string = '';
  excelSub!: Subscription;
  makeExcel() {
    let data = {
      EntryNo: this.pi.piNo,
      Purpose: this.pi.purpose,
      SupplierName: this.pi.suppliers.companyName,
      SupplierPONo: this.pi.supplierPoNo,
      SupplierSONo: this.pi.supplierSoNo,
      SupplierPrice: `${this.pi.supplierPrice} ${this.pi.supplierCurrency}`,
      CustomerPoNo: this.pi.customerPoNo,
      CustomerSoNo: this.pi.customerSoNo,
      CustomerName: this.pi.customers?.companyName || '',
      SellingPrice: `${this.pi.poValue} ${this.pi.customerCurrency}`,
      SalesPerson: this.pi.salesPerson?.name  || '',

      KAM: this.pi.kam?.name  || '',

      ManagerName: this.pi.am.name,
      AccountantName: this.pi.accountant.name,
      AddedBy: this.pi.addedBy.name,
      BankSlip: this.pi.bankSlip,
      url: this.pi.url.map((u: any) => `URL: https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${u.url}, Remarks: ${u.remarks}`).join(' | '),
      CreatedAt: this.pi.createdAt,
    };
  
    this.excelSub = this.invoiceService.excelExport(data).subscribe({
      next: (result: any) => {
        if (result && result.message === "Excel file saved successfully.") {
          this.router.navigateByUrl('/login/viewApproval/viewexcel');
        } else {
          alert(result.message);
        }
      },
      error: (error) => {
        if (error.error) {
          console.error(`Error Body: ${JSON.stringify(error.error)}`);
        }
  
        alert('There was an error exporting the Excel file. Please check the logs.');
      }
    });
  }
  
  
  

}

