/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
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
import { KAMUnavailableComponent } from './kam-unavailable/kam-unavailable.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-view-approval',
  standalone: true,
  imports: [ MatToolbarModule, MatFormFieldModule, ReactiveFormsModule, MatIconModule, MatPaginatorModule, MatDividerModule,
    RouterModule, MatCardModule,MatDialogModule, CommonModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './view-approval.component.html',
  styleUrl: './view-approval.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewApprovalComponent {
  private readonly invoiceService = inject(InvoiceService)
  private readonly loginService = inject(LoginService)
  private readonly dialog = inject(MatDialog)
  private readonly router = inject(Router)
  private readonly snackBar = inject(MatSnackBar)
  private readonly route = inject(ActivatedRoute)
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
    });;
  }

  loadData(data: any, tabIndex: number) {
    this.invoiceService.setState('tabIndex', {
      tabIndex: tabIndex
    });
    
    if (!data) {
      alert("No data available for this tab.");
      return;
    }
    this.data = data;
    const page = this.invoiceService.getState('invoiceList');
    if (page !== undefined && page !== null) {
      this.currentPage = page.page;
    }
    this.getInvoices();
  }

  invoices: any[] = [];
  invoiceSubscriptions!: Subscription;
  submittingForm: boolean = false;
  editButtonStatus: boolean = false;
  pageStatus: boolean = true;
  getInvoices() {
    this.submittingForm = true;
    let apiCall;
    if (this.data.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    }else if (this.data.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    }  else if (this.data.roleName === 'Key Account Manager') {
      if (Array.isArray(this.data.status)) {
        const statusArray = this.data.status;
        const allInvoices: any[] = [];
        let completedCalls = 0;
    
        statusArray.forEach((status: any )=> {
          this.invoiceService.getPIByKAM(status, this.filterValue, this.currentPage, this.pageSize)
            .subscribe((res: any) => {
              allInvoices.push(...res.items);
              this.totalItems = (this.totalItems || 0) + res.count;
              completedCalls++;
    
              // Once all API calls are completed
              if (completedCalls === statusArray.length) {
                this.processInvoices(allInvoices);
              }
            }, () => {
              this.submittingForm = false;
            });
        });
        return; // Don't proceed to the single apiCall block
      } else {
        apiCall = this.invoiceService.getPIByKAM(this.data.status, this.filterValue, this.currentPage, this.pageSize);
      }
      // apiCall = this.invoiceService.getPIByKAM(this.data.status, this.filterValue, this.currentPage, this.pageSize);
    } else if (this.data.roleName === 'Manager') {
      if (Array.isArray(this.data.status)) {
        const statusArray = this.data.status;
        const allInvoices: any[] = [];
        let completedCalls = 0;
    
        statusArray.forEach((status: any )=> {
          this.invoiceService.getPIByAM(status, this.filterValue, this.currentPage, this.pageSize)
            .subscribe((res: any) => {
              allInvoices.push(...res.items);
              this.totalItems = (this.totalItems || 0) + res.count;
              completedCalls++;
    
              // Once all API calls are completed
              if (completedCalls === statusArray.length) {
                this.processInvoices(allInvoices);
              }
            }, () => {
              this.submittingForm = false;
            });
        });
        return; // Don't proceed to the single apiCall block
      } else {
        apiCall = this.invoiceService.getPIByAM(this.data.status, this.filterValue, this.currentPage, this.pageSize);
      }
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
        this.processInvoices(res.items, res.count);
      }, () => {
        this.submittingForm = false;
      });
    }
  }

  processInvoices(invoicesArray: any[], count?: number) {
    const invoice = invoicesArray || [];
    this.totalItems = count || invoice.length;
  
    invoice.forEach((mainObj: any) => {
      const matchingStatus = mainObj.performaInvoiceStatuses?.find(
        (statusObj: any) => statusObj.status === mainObj.status
      );
      if (matchingStatus) {
        mainObj.remarks = matchingStatus.remarks;
      }
    });
  
    this.invoices = [...invoice];
  
    for (let i = 0; i < this.invoices.length; i++) {
      const inv = this.invoices[i];
      const invoiceSP = inv?.salesPersonId;
      const invoiceKAM = inv?.kamId;
      const invoiceAM = inv?.amId;
      const invoiceMA = inv?.accountantId;
  
      if (this.user === invoiceSP || this.user === invoiceKAM || this.user === invoiceAM || this.user === invoiceMA) {
        inv.userStatus = true;
      }
  
      if (inv.addedById === this.user) {
        const role = inv.addedBy.role.roleName;
        const status = inv.status;
  
        if (
          (role === 'Sales Executive' &&
            ['GENERATED', 'KAM REJECTED', 'AM REJECTED', 'INITIATED', 'AM DECLINED'].includes(status)) ||
          (role === 'Key Account Manager' &&
            ['KAM VERIFIED', 'AM REJECTED', 'INITIATED'].includes(status)) ||
          (role === 'Manager' &&
            ['AM VERIFIED', 'AM APPROVED'].includes(status))
        ) {
          inv.editButtonStatus = true;
        } else {
          inv.editButtonStatus = false;
        }
      } else {
        if (
          this.data.roleName === 'Team Lead' &&
          ['GENERATED', 'KAM REJECTED', 'AM REJECTED', 'INITIATED', 'AM DECLINED'].includes(inv.status)
        ) {
          inv.editButtonStatus = true;
        }
      }
    }
  
    this.submittingForm = false;
    this.cd.detectChanges();
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
    this.invoiceService.setState('invoiceList', {
      page: this.currentPage
    });
    this.getInvoices();
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
          this.snackBar.open("PI deleted successfully...","" ,{duration:3000})
          this.getInvoices()
        },(error=>{

          this.snackBar.open(error.error.message,"" ,{duration:3000})
        }))
      }
    });
  }

  verifiedSub: Subscription;
  dialogSub!: Subscription;
  verified(value: string, piNo: string, sp: string, id: number, stat: string){
    let status = this.data.status;
    if(stat === 'INITIATED' && value === 'approved') status = 'AM APPROVED';
    else if(stat === 'INITIATED' && value === 'rejected') status = 'AM DECLINED';
    if((status === 'GENERATED' || (Array.isArray(status) && status.includes('KAM VERIFIED'))) && value === 'approved') status = 'KAM VERIFIED';
    else if((status === 'GENERATED' || (Array.isArray(status) && status.includes('KAM VERIFIED'))) && value === 'rejected') status = 'KAM REJECTED';
    else if((status === 'KAM VERIFIED' || (Array.isArray(status) && status.includes('AM VERIFIED'))) && value === 'approved') status = 'AM VERIFIED';
    else if((status === 'KAM VERIFIED' || (Array.isArray(status) && status.includes('AM VERIFIED'))) && value === 'rejected') status = 'AM REJECTED';

    const dialogRef = this.dialog.open(VerificationDialogueComponent, {
      data: { invoiceNo: piNo, status: status, sp: sp }
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(result => {
      this.submittingForm = true;
      if(result){
        const data = {
          status: status,
          performaInvoiceId: id,
          remarks: result.remarks,
          kamId: result.kamId,
          amId: result.amId,
          accountantId: result.accountantId
        }

        this.verifiedSub = this.invoiceService.updatePIStatus(data).subscribe(() => {
          this.getInvoices()
          this.snackBar.open(`Invoice ${piNo} updated to ${status}...`,"" ,{duration:3000})
          this.router.navigateByUrl('login/viewApproval/view')
        });
      }
    })
  }

  kamUpdateSub!: Subscription;  
  handleKamUnavailable(invoiceId: number, piNo: string, addName: string) {
    const dialogRef = this.dialog.open(KAMUnavailableComponent, {
      width: '500px',
      data: { invoiceId, piNo }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'approved' || result.action === 'rejected') {
          this.verified(result.action, piNo, addName, invoiceId, 'GENERATED');
        } 
        else if (result.action === 'changeKam') {
          this.submittingForm = true;
          const data = {
            kamId: result.newKam
          }
          this.kamUpdateSub = this.invoiceService.updateKAM(data, invoiceId).subscribe(res =>{
            this.submittingForm = false;
            this.snackBar.open(`KAM is changed...`,"" ,{duration:3000})
            this.getInvoices()
          })
        }
      }
    });
  }

}

