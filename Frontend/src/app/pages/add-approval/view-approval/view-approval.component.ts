import { Component, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '@services/invoice.service';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { VerificationDialogueComponent } from './verification-dialogue/verification-dialogue.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { BankReceiptDialogueComponent } from './bank-receipt-dialogue/bank-receipt-dialogue.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-view-approval',
  standalone: true,
  imports: [
    MatToolbarModule, MatFormFieldModule, ReactiveFormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatDividerModule,
    RouterModule,
    MatCardModule,
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './view-approval.component.html',
  styleUrl: './view-approval.component.scss'
})
export class ViewApprovalComponent {
  _snackbar = inject(MatSnackBar)
  invoiceService = inject(InvoiceService)
  loginService = inject(LoginService)
  dialog = inject(MatDialog)
  router = inject(Router)
  snackBar = inject(MatSnackBar)
  route = inject(ActivatedRoute)

  @Input() status: string = '';

  selectedTab: string = '';
  header: string = 'Invoices';
  onTabClick(tabName: string) {
    this.selectedTab = tabName;
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.invoiceSubscriptions?.unsubscribe();
  }

  user: number;
  isSubmitted: boolean = false;
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.isSubmitted = params['isSubmitted'] === 'true'; // Convert the string to a boolean
      console.log(this.isSubmitted); // This will log true or false based on the query parameter
    });
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    this.user = user.id;
    let roleId = user.role
    this.getRoleById(roleId)
  }

  roleSub!: Subscription;
  roleName!: string;
  sp: boolean = false;
  kam: boolean = false;
  am: boolean = false;
  ma: boolean = false;
  admin: boolean = false;
  teamLead: boolean = false;
  pendingHeader : string = '';
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
      if(!this.isSubmitted){
        if(this.roleName === 'Sales Executive') { 
          this.status = 'GENERATED'; this.sp = true; this.header = 'REJECTED'; this.pendingHeader='GENERATED'
         }
        if(this.roleName === 'Key Account Manager') { 
          this.status = 'GENERATED'; this.kam = true; this.header = 'AM REJECTED'; this.pendingHeader='GENERATED'
        }
        if(this.roleName === 'Manager') { 
          this.status = 'KAM VERIFIED'; this.am = true; this.header = 'REJECTED'; this.pendingHeader='VERIFIED'
        }
        if(this.roleName === 'Accountant') { 
          this.status = 'AM VERIFIED'; this.ma = true; this.pendingHeader='VERIFIED'
        }
        if(this.roleName === 'Administrator' || this.roleName === 'Super Administrator') { this.admin = true }
        if(this.roleName === 'Team Lead') { this.teamLead = true }
      }else{
        this.status = '';
        this.selectedTab = 'invoice';
        this.pageStatus = false;
        if(this.roleName === 'Sales Executive') { 
          this.sp = true; this.header = 'REJECTED'; this.pendingHeader='GENERATED'
         }
        if(this.roleName === 'Key Account Manager') { 
          this.kam = true; this.header = 'AM REJECTED'; this.pendingHeader='GENERATED'
        }
        if(this.roleName === 'Manager') { 
          this.am = true; this.header = 'REJECTED'; this.pendingHeader='VERIFIED'
        }
        if(this.roleName === 'Accountant') { 
          this.ma = true; this.pendingHeader='VERIFIED'
        }
      }

      this.getInvoices();
    })
  }

  invoices: any[] = [];
  invoiceSubscriptions!: Subscription;
  submittingForm: boolean = false;
  editButtonStatus: boolean = false;
  getInvoices() {
    let invoice!: PerformaInvoice[];

    let apiCall;
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP(this.status, this.filterValue, this.currentPage, this.pageSize);
    }else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP(this.status, this.filterValue, this.currentPage, this.pageSize);
    }  else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM(this.status, this.filterValue, this.currentPage, this.pageSize);
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM(this.status, this.filterValue, this.currentPage, this.pageSize);
    } else if (this.roleName === 'Accountant') {
      this.pageStatus = false
      apiCall = this.invoiceService.getPIByMA(this.status, this.filterValue, this.currentPage, this.pageSize);
    }else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin(this.status, this.filterValue, this.currentPage, this.pageSize);
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        invoice = res.items;
        this.totalItems = res.count;

        if (invoice) {
          invoice.forEach((mainObj: any) => {
            const matchingStatus = mainObj.performaInvoiceStatuses.find(
              (statusObj: any) => statusObj.status === mainObj.status
            );
            if (matchingStatus) {
              mainObj.remarks = matchingStatus.remarks;
            }
          });

          this.invoices = invoice;

          for (let i = 0; i < this.invoices.length; i++) {
            let invoiceSP = this.invoices[i]?.salesPersonId;
            let invoiceKAM = this.invoices[i]?.kamId;
            let invoiceAM = this.invoices[i]?.amId;
            let invoiceMA = this.invoices[i]?.accountantId;

            // Check if the current user matches any role in the invoice
            if (this.user === invoiceSP || this.user === invoiceKAM || this.user === invoiceAM || this.user === invoiceMA) {
              this.invoices[i] = {
                ...this.invoices[i],
                userStatus: true
              };
            }

            if(invoice[i].addedById === this.user){
              if(invoice[i].addedBy.role.roleName === 'Sales Executive' &&
                (invoice[i].status === 'GENERATED' || invoice[i].status === 'KAM REJECTED' || invoice[i].status === 'AM REJECTED') ){
                  this.invoices[i] = {
                    ...this.invoices[i],
                    editButtonStatus: true
                  };
              }else if(invoice[i].addedBy.role.roleName === 'Key Account Manager' &&
                (invoice[i].status === 'KAM VERIFIED' || invoice[i].status === 'AM REJECTED') ){
                  this.invoices[i] = {
                    ...this.invoices[i],
                    editButtonStatus: true
                  };
              }else if(invoice[i].addedBy.role.roleName === 'Manager' &&
                (invoice[i].status === 'AM VERIFIED') ){
                  this.invoices[i] = {
                    ...this.invoices[i],
                    editButtonStatus: true
                  };
              }else{
                this.invoices[i] = {
                  ...this.invoices[i],
                  editButtonStatus: false
                };
              }
            }
          }
        }

        this.submittingForm = false;
      }, (error: any) => {
        this.submittingForm = false;
      });
    }
  }

  filterValue!: string;
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    this.getInvoices()
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getInvoices();
  }

  pageStatus: boolean = true;
  onStepSelectionChange(status: string) {
    if(this.roleName === 'Sales Executive'){
      if(status === 'assigned'){
        // this.status = 'GENERATED';
        this.status = 'REJECTED';
        this.getInvoices();
      }else if(status === 'pending'){
        // this.status = 'REJECTED';
        this.status = 'GENERATED';
        this.getInvoices()
      }else if(status === 'completed'){
        this.status = 'BANK SLIP ISSUED';
        this.getInvoices()
      }else if(status === 'all'){
        this.status = '';
        this.getInvoices()
      }
    }else if(this.roleName === 'Key Account Manager') {
      if(status === 'pending'){
        this.pageStatus = true;
        this.status = 'GENERATED'
        this.getInvoices()
      }else if(status === 'assigned'){
        this.pageStatus = false;
        this.status = 'AM REJECTED'
        this.getInvoices()
      }else if(status === 'completed'){
        this.pageStatus = false;
        this.status = 'BANK SLIP ISSUED';
        this.getInvoices()
      }else if(status === 'all'){
        this.pageStatus = false;
        this.status = '';
        this.getInvoices()

      }

    }else if(this.roleName === 'Manager') {
      if(status === 'pending'){
        this.pageStatus = true;
        this.status = 'KAM VERIFIED';
        this.getInvoices()
      }else if(status === 'assigned'){
        this.pageStatus = false;
        this.status = 'REJECTED'
        this.getInvoices()
      }else if(status === 'completed'){
        this.pageStatus = false;
        this.status = "BANK SLIP ISSUED"
        this.getInvoices()
      }else if(status === 'all'){
        this.pageStatus = false;
         this.status = ''
        this.getInvoices()

      }

    }else if(this.roleName === 'Accountant') {
      if(status === 'pending'){
        this.pageStatus = false;
        this.status = 'AM VERIFIED'
        this.getInvoices()
      }else if(status === 'completed'){
        this.pageStatus = false;
        this.status = 'BANK SLIP ISSUED'
        this.getInvoices()
      }else if(status === 'all'){
        this.pageStatus = false;
        this.status = ''
        this.getInvoices()
      }

    }
  }

  // submittingForm: boolean = false;
  verified(value: string, piNo: string, sp: string, id: number){
    let status = this.status;
    this.submittingForm = true;
    if(status === 'GENERATED' && value === 'approved') status = 'KAM VERIFIED';
    else if(status === 'GENERATED' && value === 'rejected') status = 'KAM REJECTED';
    else if(status === 'KAM VERIFIED' && value === 'approved') status = 'AM VERIFIED';
    else if(status === 'KAM VERIFIED' && value === 'rejected') status = 'AM REJECTED';
    // else if(status === 'AM VERIFIED' ) return this.addBankSlip(this.pi.id, this.piNo)

    const dialogRef = this.dialog.open(VerificationDialogueComponent, {
      data: { invoiceNo: piNo, status: status, sp: sp }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.submittingForm = true;
        let data = {
          status: status,
          performaInvoiceId: id,
          remarks: result.remarks,
          amId: result.amId,
          accountantId: result.accountantId
        }

        this.invoiceService.updatePIStatus(data).subscribe(result => {
          this.submittingForm = false;
          this.getInvoices()
          this.snackBar.open(`Invoice ${piNo} updated to ${status}...`,"" ,{duration:3000})
          this.router.navigateByUrl('login/viewApproval')
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
        this.getInvoices()
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
        // this.invoiceService.updatePIStatusWithBankSlip(data).subscribe(result => {
        // });
      }
    })
  }

  private pressTimer: any;
  private longPressDuration = 500; // Duration in ms for a long press
  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    clearTimeout(this.pressTimer);
  }

  // @HostListener('document:mouseleave', ['$event'])
  // onMouseLeave(event: MouseEvent) {
  //   clearTimeout(this.pressTimer);
  // }

  // onMouseDown(event: MouseEvent, invoice: any) {
  //   this.pressTimer = setTimeout(() => {
  //     this.openDialog(invoice);
  //   }, this.longPressDuration);
  // }

  // openDialog(invoice: any) {
  //   const snackBarRef = this.snackBar.open('Approve or Reject?', 'Approve', {
  //     duration: 5000,
  //     horizontalPosition: 'center',
  //     verticalPosition: 'bottom',
  //   });

  //   snackBarRef.onAction().subscribe(() => {
  //     this.handleApprove(invoice);
  //   });

  //   snackBarRef.afterDismissed().subscribe(info => {
  //     if (!info.dismissedByAction) {
  //       // If not dismissed by action, prompt for rejection
  //       this.snackBar.open('Do you want to reject?', 'Reject', {
  //         duration: 5000,
  //         horizontalPosition: 'center',
  //         verticalPosition: 'bottom',
  //       }).onAction().subscribe(() => {
  //         this.handleReject(invoice);
  //       });
  //     }
  //   });
  // }



  deleteFunction(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '320px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {

        this.invoiceService.deleteInvoice(id).subscribe((res)=>{
          this._snackbar.open("PI deleted successfully...","" ,{duration:3000})
          this.getInvoices()
        },(error=>{

          this._snackbar.open(error.error.message,"" ,{duration:3000})
        }))
      }
    });


    }

  handleApprove(invoice: any) {
  }

  handleReject(invoice: any) {
  }

}

function compare(a: number | string, b: number | string, isAsc: boolean) {
return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
