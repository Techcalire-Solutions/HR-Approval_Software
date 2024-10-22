import { Component, inject, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { InvoiceService } from '@services/invoice.service';
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
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { User } from '../../../common/interfaces/user';
import { UsersService } from '@services/users.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
@Component({
  selector: 'app-approval-report',
  standalone: true,
  imports: [ CommonModule, RouterModule, MatDatepickerModule, ReactiveFormsModule,  MatFormFieldModule, MatCardModule, MatToolbarModule,
    MatIconModule, MatButtonModule, MatSelectModule, MatInputModule, MatProgressBarModule, MatProgressSpinnerModule, SafePipe,
    MatPaginatorModule, MatDividerModule, MatChipsModule],
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
    this.usersSub?.unsubscribe();
    this.invoiceSub?.unsubscribe();
  }

  user: number;
  isSubmitted: boolean = false;
  ngOnInit() {
    this.getUsers()
    this.getByFilter()
  }
  invoices: any[] = [];
  invoiceSub!: Subscription;
  totalItems = 0;
  getByFilter(){
    let data = {
      invoices: this.invoices, 
      invoiceNo: this.filterValue ? this.filterValue : '',
      addedBy: this.addedBy ? this.addedBy : null,  
      status: this.status ? this.status : null,  
      date: this.date ? this.date : null
    };
    
    this.invoiceSub = this.invoiceService.getAdminReports(data).subscribe(res=>{
      this.invoices = res;
      this.totalItems = res.length;
    })
  }

  getStatus(event: MatSelectChange) {
    this.status = event.value;
    this.getByFilter()
  }

  filterValue: string = '';
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    
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
    
    this.getByFilter()
  }

  filteredUsers: User[] = [];
  usersSub!: Subscription;
  Users: User[] = [];
  getUsers() {
    this.usersSub = this.userService.getUser().subscribe(res => {
      this.Users = res;
    });
  }

}


