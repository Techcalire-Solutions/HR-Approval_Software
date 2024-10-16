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
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-view-invoices',
  standalone: true,
  imports: [
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
      // else if(this.roleName === 'Administrator'){
      //   pi = {
      //     ...pi,
      //     approveButtonStatus: true
      //   };
      // }
      // this.url = environment.apiUrl + pi.url;
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
        // this.getInvoices()
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
       
      }
    })
  }
}

