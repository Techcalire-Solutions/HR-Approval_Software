import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ExpensesService } from '@services/expenses.service';
import { Expense } from '../../../../common/interfaces/expense';
import { Subscription } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { VerificationDialogueComponent } from '../../view-approval/verification-dialogue/verification-dialogue.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BankReceiptDialogueComponent } from '../../view-approval/bank-receipt-dialogue/bank-receipt-dialogue.component';

@Component({
  selector: 'app-view-expense',
  standalone: true,
  imports: [MatCardModule, MatToolbarModule, MatPaginatorModule, RouterModule],
  templateUrl: './view-expense.component.html',
  styleUrl: './view-expense.component.scss'
})
export class ViewExpenseComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.getExpenses();
  }


 private expenseService = inject(ExpensesService);
  applyFilter(event: Event){

  }

  data: any;
  loadData(data: any) {
    console.log("loadData called with:", data);  
    if (!data) {
      console.error("No data available for this tab.");
      return;
    }
    this.data = data;
    this.getExpenses();
  }

  expenses: Expense[] = [];
  expenseSub!: Subscription;
  getExpenses(){
    this.expenseSub = this.expenseService.getExpenseByUser().subscribe((expenses) => {
      console.log(expenses);
      
      this.expenses = expenses;
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
          this.getExpenses()
          this.snackBar.open(`Expense ${piNo} updated to ${status}...`,"" ,{duration:3000})
          this.router.navigateByUrl('login/viewApproval')
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
        this.getExpenses();
        this.snackBar.open(`BankSlip is attached with Invoice ${piNo} ...`,"" ,{duration:3000})
      }
    })
  }

  ngOnDestroy(): void {
    this.expenseSub?.unsubscribe();
  }

  deleteFunction(id: number){

  }
}
