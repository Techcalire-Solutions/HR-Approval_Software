import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatOptionModule, NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule, MatDatepickerToggle, MatDateRangeInput, MatDateRangePicker } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LoginService } from '@services/login.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { ExpensesService } from '@services/expenses.service';
import { Expense } from '../../../common/interfaces/payments/expense';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SafePipe } from '../../../common/safe.pipe';
import { User } from '../../../common/interfaces/users/user';

@Component({
  selector: 'app-expense-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDatepickerModule,  MatFormFieldModule, MatCardModule, MatToolbarModule,
    MatIconModule, MatButtonModule, MatSelectModule, MatInputModule, SafePipe,
    MatPaginatorModule, MatDividerModule, MatDateRangeInput],
  templateUrl: './expense-reports.component.html',
  styleUrl: './expense-reports.component.scss',
    providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
})
export class ExpenseReportsComponent implements OnInit, OnDestroy{
  _snackbar = inject(MatSnackBar)
  expenseService = inject(ExpensesService)
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
  invoices: Expense[] = [];
  invoiceSub!: Subscription;
  totalItems = 0;
  getByFilter(){
    let data = {
      invoices: this.invoices,
      exNo: this.filterValue ? this.filterValue : '',
      user: this.addedBy ? this.addedBy : null,
      status: this.status ? this.status : null,
      startDate: this.startDate ? this.startDate : null,
      endDate: this.endDate ? this.endDate : null
    };

    this.invoiceSub = this.expenseService.getExpenseReports(data).subscribe(res=>{
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

  startDate: any;
  endDate: any;
  onDateChange(type: 'start' | 'end', event: MatDatepickerInputEvent<Date>): void {
    if (type === 'start') {
      this.startDate = event.value;
    } else if (type === 'end') {
      this.endDate = event.value;
    }

    if (this.startDate && this.endDate) {
      this.getByFilter();
    }
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

  makeExcel() {
    let data = {
      invoices: this.invoices,
      invoiceNo: this.filterValue? this.filterValue : '',
      addedBy: this.addedBy? this.addedBy : null,
      status: this.status? this.status : null,
      startDate: this.startDate? this.startDate : null,
      endDate: this.endDate? this.endDate : null
    }
    console.log(data);

    this.expenseService.reportExport(data).subscribe((res:any)=>{
      if (res.message === 'File uploaded successfully') {
        this.router.navigate(['login/viewApproval/approvalReport/excellog/openexcel'], { queryParams: { name: res.name } });
        this.snackBar.open('Excel File exported successfully...', '', { duration: 3000 });
      }
    })
  }




}
