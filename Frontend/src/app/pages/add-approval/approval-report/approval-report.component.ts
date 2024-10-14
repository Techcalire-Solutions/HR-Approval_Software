import { Component, inject, Input, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { InvoiceService } from '@services/invoice.service';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
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
import { SafePipe } from "../view-invoices/safe.pipe";
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { BankReceiptDialogueComponent } from '../view-approval/bank-receipt-dialogue/bank-receipt-dialogue.component';
import { VerificationDialogueComponent } from '../view-approval/verification-dialogue/verification-dialogue.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { User } from '../../../common/interfaces/user';
import { UsersService } from '@services/users.service';
@Component({
  selector: 'app-approval-report',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule, SafePipe,
    MatPaginatorModule,
    MatDividerModule],
  templateUrl: './approval-report.component.html',
  styleUrl: './approval-report.component.scss'
})
export class ApprovalReportComponent {
  _snackbar = inject(MatSnackBar)
  invoiceService = inject(InvoiceService)
  userService= inject(UsersService)
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
    this.querySub?.unsubscribe();
    this.verifiedSub?.unsubscribe();
  }

  user: number;
  isSubmitted: boolean = false;
  querySub!: Subscription;
  ngOnInit() {
    this.getUsers()
    this.querySub = this.route.queryParams.subscribe(params => {
      this.isSubmitted = params['isSubmitted'] === 'true'; 
      console.log(this.isSubmitted);
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
 // Store filter values
 filters = {
  search: '',
  fromDate: '',
  toDate: '',
  addedBy: '',
  status: ''
};
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
    }else if (this.roleName === 'Administrator' || this.roleName === 'Super Administrator') {
      apiCall = this.invoiceService.getPIByAdmin(this.status, this.filterValue, this.currentPage, this.pageSize);
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        invoice = res.items;
        this.totalItems = res.count;
        console.log(invoice);
        
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
          console.log(this.invoices);
          
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

  filterValue: string = ''; // Initialize filterValue to an empty string

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    this.getInvoices()
  }

  filteredUsers: User[] = []; // Property to hold filtered users
  usersSub!: Subscription;
  Users: User[] = [];
  showDropdown: boolean = false; // To control dropdown visibility
  applyFilterByUserAdded(event: Event): void {
    const input = (event.target as HTMLInputElement).value.trim();
    this.filterValue = input;
    console.log('user added', this.filterValue);
    
    // Filter users based on input
    this.filteredUsers = this.Users.filter(user =>
      user.name.toLowerCase().includes(input.toLowerCase())
    );

    this.showDropdown = this.filteredUsers.length > 0; // Show dropdown if there are matching users
  }

  getUsers() {
    this.usersSub = this.userService.getUser().subscribe(res => {
      this.Users = res;
    });
  }

  selectUser(user: User) {
    this.filterValue = user.name; // Set the input value to the selected user
    this.showDropdown = false; // Hide the dropdown after selection
    this.getInvoices(); // Call the method to fetch invoices based on the selected user
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false; // Delay to allow click event to register
    }, 200);
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
        this.status = 'REJECTED';
        this.getInvoices();
      }else if(status === 'pending'){
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

  verifiedSub: Subscription;
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

        this.verifiedSub = this.invoiceService.updatePIStatus(data).subscribe(result => {
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
      }
    })
  }
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
}


