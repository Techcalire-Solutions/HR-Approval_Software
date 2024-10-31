import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ExpensesService } from '@services/expenses.service';
import { Expense } from '../../../../common/interfaces/expense';
import { Subscription } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { VerificationDialogueComponent } from '../../view-approval/verification-dialogue/verification-dialogue.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BankReceiptDialogueComponent } from '../../view-approval/bank-receipt-dialogue/bank-receipt-dialogue.component';
import { CommonModule } from '@angular/common';
import { DeleteDialogueComponent } from '../../../../theme/components/delete-dialogue/delete-dialogue.component';
import { InvoiceService } from '@services/invoice.service';
import { ExpenseReceiptDialogComponent } from '../expense-receipt-dialog/expense-receipt-dialog.component';

@Component({
  selector: 'app-view-expense',
  standalone: true,
  imports: [MatCardModule, MatToolbarModule, MatPaginatorModule, RouterModule, CommonModule,ExpenseReceiptDialogComponent],
  templateUrl: './view-expense.component.html',
  styleUrl: './view-expense.component.scss'
})
export class ViewExpenseComponent implements OnInit, OnDestroy{
  private invoiceService = inject(InvoiceService)
  userId: number;
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    this.userId =  user.id

    this.getRoleById(user.role)
    this.getExpenses(user.id);
  }

  roleSub!: Subscription;
  roleName: string;
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
      console.log(this.roleName);

    })
  }

  private expenseService = inject(ExpensesService);
  filterValue: string = '';
  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim()
    this.getExpenses(this.userId)
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getExpenses(this.userId);
  }

  data: any;
  isFlow: boolean = false;
  loadData(data: any) {
    this.isFlow = true;
    if (!data) {
      console.error("No data available for this tab.");
      return;
    }
    this.data = data;
    this.getExpenses(this.userId);
  }

  expenses: any[] = [];
  expenseSub!: Subscription;
  getExpenses(userId: number){
    this.expenseSub = this.expenseService.getExpenseByUser(this.filterValue, this.currentPage, this.pageSize, this.isFlow)
    .subscribe((expenses: any) => {
      this.expenses = expenses.items;
      this.totalItems = expenses.count;
      if (this.expenses) {

        this.expenses = [...this.expenses];

        for (let i = 0; i < this.expenses.length; i++) {
          let invoiceUser = this.expenses[i]?.userId;
          let invoiceAM = this.expenses[i]?.amId;
          let invoiceMA = this.expenses[i]?.accountantId;

          if(this.roleName === 'Administrator' || this.roleName === 'Super Administrator'){
            this.expenses[i] = {
              ...this.expenses[i],
              editButtonStatus: true
            };
            console.log(expenses[i]);

          }else if (userId === invoiceUser || userId === invoiceAM  || userId === invoiceMA) {
            this.expenses[i] = {
              ...this.expenses[i],
              userStatus: true
            };
          }
          if(this.expenses[i].userId === userId){
            if(this.expenses[i].user.role.roleName != 'Manager' &&
              (this.expenses[i].status === 'Generated'|| this.expenses[i].status === 'AM Rejected') ){
                this.expenses[i] = {
                  ...this.expenses[i],
                  editButtonStatus: true
                };
            }else if(this.expenses[i].user.role.roleName === 'Manager' &&
              (this.expenses[i].status === 'AM Verified') ){
                this.expenses[i] = {
                  ...this.expenses[i],
                  editButtonStatus: true
                };
            }else{
              this.expenses[i] = {
                ...this.expenses[i],
                editButtonStatus: false
              };
            }

          }
        }
      }
    });
  }

  verifiedSub: Subscription;
  dialogSub!: Subscription;
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  verified(value: string, piNo: string, sp: string, id: number, stat: string){
    let status = stat;

    if(status === 'Generated' && value === 'approved') status = 'AM Verified';
    else if(status === 'Generated' && value === 'rejected') status = 'AM Rejected';

    const dialogRef = this.dialog.open(VerificationDialogueComponent, {
      data: { invoiceNo: piNo, status: status, sp: sp }
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(result => {
      if(result){
        let data = {
          status: status,
          expenseId: id,
          remarks: result.remarks,
          accountantId: result.accountantId
        }

        this.verifiedSub = this.expenseService.updateStatus(data).subscribe(result => {
          this.getExpenses(this.userId)
          this.snackBar.open(`Expense ${piNo} updated to ${status}...`,"" ,{duration:3000})
          this.router.navigateByUrl('login/viewApproval/view')
        });
      }
    })
  }

  addBankSlip(piNo: string, id: number, status: string){
    const dialogRef = this.dialog.open(ExpenseReceiptDialogComponent, {
      data: { invoiceNo: piNo, id: id, status: status }
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(result => {
      if(result){
        this.getExpenses(this.userId);
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
      }
    })
  }

  ngOnDestroy(): void {
    this.expenseSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
  }

  deleteSub!: Subscription;
  deleteFunction(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '320px',
      data: {}
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteSub = this.expenseService.deleteExpense(id).subscribe((res)=>{
          this.snackBar.open("Expense deleted successfully...","" ,{duration:3000})
          this.getExpenses(this.userId)
        },(error=>{

          this.snackBar.open(error.error.message,"" ,{duration:3000})
        }))
      }
    });
  }
}
