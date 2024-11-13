/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { PerformaInvoice } from '../../../common/interfaces/payments/performaInvoice';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '@services/invoice.service';
import { VerificationDialogueComponent } from './verification-dialogue/verification-dialogue.component';
import { BankReceiptDialogueComponent } from './bank-receipt-dialogue/bank-receipt-dialogue.component';

@Component({
  selector: 'app-view-approval',
  standalone: true,
  imports: [ MatToolbarModule, MatFormFieldModule, ReactiveFormsModule, MatIconModule, MatPaginatorModule, MatDividerModule,
    RouterModule, MatCardModule,MatDialogModule, CommonModule
  ],
  templateUrl: './view-approval.component.html',
  styleUrl: './view-approval.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewApprovalComponent {
  _snackbar = inject(MatSnackBar)
  private invoiceService = inject(InvoiceService)
  loginService = inject(LoginService)
  dialog = inject(MatDialog)
  router = inject(Router)
  snackBar = inject(MatSnackBar)
  route = inject(ActivatedRoute)
  @Input() data: any;
  private cd = inject(ChangeDetectorRef)

  @Input() status: string = '';

  header: string = 'Invoices';

  ngOnDestroy(): void {
    this.invoiceSubscriptions?.unsubscribe();
    this.querySub?.unsubscribe();
    this.verifiedSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
  }

  user: number;
  isSubmitted: boolean = false;
  querySub!: Subscription;
  ngOnInit() {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)
    this.user = user.id;
    this.querySub = this.route.queryParams.subscribe(params => {
      this.isSubmitted = params['isSubmitted'] === 'true';
    });
  }

  loadData(data: any) {
    console.log("loadData called with:", data);  // Add this for debugging
    if (!data) {
      console.error("No data available for this tab.");
      return;
    }
    this.data = data;
    this.getInvoices();
  }

  invoices: any[] = [];
  invoiceSubscriptions!: Subscription;
  submittingForm: boolean = false;
  editButtonStatus: boolean = false;
  pageStatus: boolean = true;
  getInvoices() {
    let invoice!: PerformaInvoice[];

    let apiCall;
    if (this.data.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    }else if (this.data.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    }  else if (this.data.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    } else if (this.data.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    } else if (this.data.roleName === 'Accountant') {
      this.pageStatus = false
      apiCall = this.invoiceService.getPIByMA(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    }else if (this.data.roleName === 'Administrator' || this.data.roleName === 'Super Administrator') {
      apiCall = this.invoiceService.getPIByAdmin(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    }

    if (apiCall) {
      if (this.invoiceSubscriptions) {
        this.invoiceSubscriptions.unsubscribe();
      }

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

          this.invoices = [...invoice];

          for (let i = 0; i < this.invoices.length; i++) {
            const invoiceSP = this.invoices[i]?.salesPersonId;
            const invoiceKAM = this.invoices[i]?.kamId;
            const invoiceAM = this.invoices[i]?.amId;
            const invoiceMA = this.invoices[i]?.accountantId;

            if (this.user === invoiceSP || this.user === invoiceKAM || this.user === invoiceAM || this.user === invoiceMA) {
              this.invoices[i] = {
                ...this.invoices[i],
                userStatus: true
              };
            }

            if(invoice[i].addedById === this.user){
              if(invoice[i].addedBy.role.roleName === 'Sales Executive' &&
                (invoice[i].status === 'GENERATED' || invoice[i].status === 'KAM REJECTED' || invoice[i].status === 'AM REJECTED' ||
                  invoice[i].status === 'INITIATED'|| invoice[i].status === 'AM DECLINED' ) ){
                  this.invoices[i] = {
                    ...this.invoices[i],
                    editButtonStatus: true
                  };
              }else if(invoice[i].addedBy.role.roleName === 'Key Account Manager' &&
                (invoice[i].status === 'KAM VERIFIED' || invoice[i].status === 'AM REJECTED' || invoice[i].status === 'INITIATED') ){
                  this.invoices[i] = {
                    ...this.invoices[i],
                    editButtonStatus: true
                  };
              }else if(invoice[i].addedBy.role.roleName === 'Manager' &&
                (invoice[i].status === 'AM VERIFIED' ||  invoice[i].status === 'AM APPROVED') ){

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
        this.cd.detectChanges();
      }, () => {
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

  verifiedSub: Subscription;
  dialogSub!: Subscription;
  verified(value: string, piNo: string, sp: string, id: number, stat: string){
    let status = this.data.status;
    console.log(status);

    this.submittingForm = true;
    if(stat === 'INITIATED' && value === 'approved') status = 'AM APPROVED';
    else if(stat === 'INITIATED' && value === 'rejected') status = 'AM DECLINED';
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
        const data = {
          status: status,
          performaInvoiceId: id,
          remarks: result.remarks,
          kamId: result.kamId,
          amId: result.amId,
          accountantId: result.accountantId
        }

        this.verifiedSub = this.invoiceService.updatePIStatus(data).subscribe(() => {
          this.submittingForm = false;
          this.getInvoices()
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
        this.getInvoices()
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
      }
    })
  }

  deleteSub!: Subscription;
  deleteFunction(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '320px',
      data: {}
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteSub = this.invoiceService.deleteInvoice(id).subscribe(()=>{
          this._snackbar.open("PI deleted successfully...","" ,{duration:3000})
          this.getInvoices()
        },(error=>{

          this._snackbar.open(error.error.message,"" ,{duration:3000})
        }))
      }
    });
  }

}

