import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { VerificationDialogueComponent } from '../view-approval/verification-dialogue/verification-dialogue.component';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SafePipe } from './safe.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PerformaInvoiceStatus } from '../../../common/interfaces/performa-invoice-status';
import { MatTableModule } from '@angular/material/table';
import { BankReceiptDialogueComponent } from '../view-approval/bank-receipt-dialogue/bank-receipt-dialogue.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-view-invoices',
  standalone: true,
  imports: [
    CommonModule,
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
  piSub!: Subscription;
  url!: string;
  piNo!: string;
  pi!: any;
  bankSlip!: string;
  signedUrl: any[];
  getPiById(id: number){
    this.piSub = this.invoiceService.getPIById(id).subscribe(pi => {
      this.pi = pi.pi;
      console.log(pi);

      this.piNo = pi.pi.piNo;

      this.signedUrl= pi.signedUrl

      if( this.pi.status === 'GENERATED' && this.roleName === 'Key Account Manager' ){
        this.pi = {
          ...this.pi,
          approveButtonStatus: true
        };
      }else if( this.pi.status === 'KAM VERIFIED' && this.roleName === 'Manager'){
        this.pi = {
          ...this.pi,
          approveButtonStatus: true
        };
      }
      if(pi.pi.bankSlip != null) this.bankSlip = pi.bankSlip;
      console.log(this.bankSlip);

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
  submittingForm: boolean = false;
  verified(value: string){
    let status = this.pi.status;
    let sp;
    if(this.pi.salesPersonId!=null)  sp = this.pi.salesPerson?.name;
    else sp=this.pi.kam?.name;


    if(status === 'GENERATED' && value === 'approved') status = 'KAM VERIFIED';
    else if(status === 'GENERATED' && value === 'rejected') status = 'KAM REJECTED';
    else if(status === 'KAM VERIFIED' && value === 'approved') status = 'AM VERIFIED';
    else if(status === 'KAM VERIFIED' && value === 'rejected') status = 'AM REJECTED';
    // else if(status === 'AM VERIFIED' ) return this.addBankSlip(this.pi.id, this.piNo)


    const dialogRef = this.dialog.open(VerificationDialogueComponent, {
      data: { invoiceNo: this.piNo, status: status, sp: sp }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.submittingForm = true;
        let data = {
          status: status,
          performaInvoiceId: this.pi.id,
          remarks: result.remarks,
          amId: result.amId,
          accountantId: result.accountantId
        }


        this.invoiceService.updatePIStatus(data).subscribe(result => {


          this.snackBar.open(`Invoice ${this.piNo} updated to ${status}...`,"" ,{duration:3000})

          this.router.navigateByUrl('/login/viewApproval')
        });
      }
    })
  }

  addBankSlip(piNo: string, id: number){
    const dialogRef = this.dialog.open(BankReceiptDialogueComponent, {
      data: { invoiceNo: piNo, id: id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
      }
    })
  }

  fileName: string = '';
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
      SalesPerson: this.pi.salesPerson.name,
      KAM: this.pi.kam.name,
      ManagerName: this.pi.am.name,
      AccountantName: this.pi.accountant.name,
      AddedBy: this.pi.addedBy.name,
      BankSlip: this.pi.bankSlip,
      url: this.pi.url.map((u: any) => `URL: https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${u.url}, Remarks: ${u.remarks}`).join(' | '),
      CreatedAt: this.pi.createdAt,
    };
  
    this.invoiceService.excelExport(data).subscribe({
      next: (result: any) => {
        // Check if the result indicates success
        console.log('Excel export successful:', result);
  
        // Example of checking the response message
        if (result && result.message === "Excel file saved successfully.") {
          // Route to the next component if the export is successful
          this.router.navigateByUrl('/login/viewexcel');
        } else {
          // Handle unexpected responses
          console.error('Unexpected response:', result);
          alert('Unexpected response from server. Please check the logs.');
        }
      },
      error: (error) => {
        // Log detailed error information
        console.error('Excel export failed:', error);
  
        if (error.error) {
          console.error(`Error Body: ${JSON.stringify(error.error)}`);
        }
  
        alert('There was an error exporting the Excel file. Please check the logs.');
      }
    });
  }
  
  
  

}

