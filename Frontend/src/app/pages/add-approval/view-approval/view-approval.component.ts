import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
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
@Component({
  selector: 'app-view-approval',
  standalone: true,
  imports: [
    MatToolbarModule,
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

  displayedColumns = ['piNo','kam', 'view', 'manage'];
  rows: any[] = [];
  sortedData!: any[];
  showResponsiveTableCode!: any;

@ViewChild(MatPaginator, { static: true }) paginator1!: MatPaginator;
  @Input() status: string = '';
  @Input() actionStatus!: any;
  @Output() edit = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() view = new EventEmitter();
  @Output() page = new EventEmitter();
  @Output() sort = new EventEmitter();
  @Output() dup = new EventEmitter();

  selectedTab: string = '';
  header: string = 'Invoices';
  onTabClick(tabName: string) {
    this.selectedTab = tabName;
  }

  constructor(  private _snackbar: MatSnackBar,private invoiceService: InvoiceService, private loginService: LoginService, private dialog: MatDialog, private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.invoiceSubscriptions?.unsubscribe();
  }

user: number;
  ngOnInit() {
    this.getInvoices()
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

      if(this.roleName === 'Sales Executive') { this.status = 'REJECTED'; this.sp = true
            this.header = 'GENERATED'
           this.pendingHeader='REJECTED'
       }
      if(this.roleName === 'Key Account Manager') { this.status = 'GENERATED'; this.kam = true;
           this.header = 'AM REJECTED'
           this.pendingHeader='GENERATED'}
      if(this.roleName === 'Manager') { this.status = 'KAM VERIFIED'; this.am = true
          this.header = 'REJECTED'
           this.pendingHeader='KAM VERIFIED'
       }
      if(this.roleName === 'Accountant') { this.status = 'AM VERIFIED'; this.ma = true
         this.pendingHeader='AM VERIFIED'
      }
      if(this.roleName === 'Administrator') { this.admin = true }
      if(this.roleName === 'Team Lead') { this.teamLead = true }
      this.getInvoices();


    })
  }

  sortData(sort: Sort) {
      const data = this.rows;

      if (!sort.active || sort.direction === '') {
          this.sortedData = data;
          return;
      }

      this.sortedData = data.sort((a, b) => {
          const isAsc = sort.direction === 'asc';

          if (['id', 'progress'].includes(sort.active)) {
              return compare(parseInt(a[sort.active]), parseInt(b[sort.active]), isAsc)
          }

          return compare(a[sort.active], b[sort.active], isAsc)
      });
  }

  findDuplicates(row: any){

  }

  invoices: any[] = [];
  invoiceSubscriptions!: Subscription;
  submittingForm: boolean = false;

  getInvoices() {
    this.submittingForm = true;
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
        console.log(res);
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
          for(let i=0;i<=this.invoices.length;i++)
          {
            let invoiceSP= this.invoices[i]?.salesPersonId
            let invoiceKAM= this.invoices[i]?.kamId
            let invoiceAM= this.invoices[i]?.amId
            let invoiceMA= this.invoices[i]?.accountantId
            if (this.user === invoiceSP || this.user === invoiceKAM || this.user === invoiceAM || this.user === invoiceMA) {
              this.invoices[i] = {
                ...this.invoices[i],
                userStatus: true
              };
            }


          }
        }

        this.submittingForm = false;
      }, (error: any) => {
        // Handle error here if needed
        this.submittingForm = false;
      });
    } else {
      this.submittingForm = false;
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
        this.status = 'GENERATED';
        this.getInvoices();
      }else if(status === 'pending'){
        this.status = 'REJECTED';
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

  @HostListener('document:mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent) {
    clearTimeout(this.pressTimer);
  }

  onMouseDown(event: MouseEvent, invoice: any) {
    this.pressTimer = setTimeout(() => {
      this.openDialog(invoice);
    }, this.longPressDuration);
  }

  openDialog(invoice: any) {
    const snackBarRef = this.snackBar.open('Approve or Reject?', 'Approve', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });

    snackBarRef.onAction().subscribe(() => {
      this.handleApprove(invoice);
    });

    snackBarRef.afterDismissed().subscribe(info => {
      if (!info.dismissedByAction) {
        // If not dismissed by action, prompt for rejection
        this.snackBar.open('Do you want to reject?', 'Reject', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }).onAction().subscribe(() => {
          this.handleReject(invoice);
        });
      }
    });
  }



  deleteFunction(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '450px',
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
