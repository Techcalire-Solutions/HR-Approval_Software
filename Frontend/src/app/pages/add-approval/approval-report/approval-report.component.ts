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
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
@Component({
  selector: 'app-approval-report',
  standalone: true,
  imports: [ CommonModule, RouterModule, MatDatepickerModule,
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
  styleUrl: './approval-report.component.scss',
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
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
    this.invoiceSubscriptions?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  user: number;
  isSubmitted: boolean = false;
  querySub!: Subscription;
  ngOnInit() {
    this.getUsers()
    this.getByFilter()
  }
  invoices: any[] = [];
  invoiceSubscriptions!: Subscription;
  submittingForm: boolean = false;
  editButtonStatus: boolean = false;
  getInvoices() {
    let invoice!: PerformaInvoice[];

    let apiCall;
    apiCall = this.invoiceService.getPIByAdmin(this.status, this.filterValue, this.currentPage, this.pageSize);
    
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
        }

        this.submittingForm = false;
      }, (error: any) => {
        this.submittingForm = false;
      });
    }
  }

  getByFilter(){
    let data = {
      invoices: this.invoices, 
      invoiceNo: this.filterValue ? this.filterValue : '',
      addedBy: this.addedBy ? this.addedBy : null,  
      status: this.status ? this.status : null,  
      date: this.date ? this.date : null
    };
    console.log(data);
    
    this.invoiceService.getAdminReports(data).subscribe(res=>{
      this.invoices = res;
      console.log(this.invoices);
    })
  }

  getStatus(event: MatSelectChange) {
    this.status = event.value;
    this.getByFilter()
  }

  filterValue: string = '';
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    console.log(this.filterValue);
    
    this.getByFilter()
  }

  date: Date;
  onDateChange(event: any): void {
    this.date = event.value;
    this.getByFilter()
  }
  

  addedBy: number
  getAdded(id: number){
    this.addedBy = id;
    console.log(this.addedBy);
    
    this.getByFilter()
  }

  filteredUsers: User[] = []; // Property to hold filtered users
  usersSub!: Subscription;
  Users: User[] = [];
  getUsers() {
    this.usersSub = this.userService.getUser().subscribe(res => {
      this.Users = res;
    });
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

}


