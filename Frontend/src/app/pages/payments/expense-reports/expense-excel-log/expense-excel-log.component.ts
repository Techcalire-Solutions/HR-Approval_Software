import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs';
import { ExcelLog } from '../../../../common/interfaces/excel-log';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';
import { ExpensesService } from '@services/expenses.service';

@Component({
  selector: 'app-expense-excel-log',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, CommonModule, RouterModule],
  templateUrl: './expense-excel-log.component.html',
  styleUrl: './expense-excel-log.component.scss'
})
export class ExpenseExcelLogComponent {

  ngOnDestroy(): void {
    this.logSub?.unsubscribe();
  }
  private invoiceService = inject(InvoiceService);
  private expenseService = inject(ExpensesService);
  ngOnInit(): void {
    this.getLog();
  }

  logSub!: Subscription;
  logs: ExcelLog[] = [];
  getLog(){
    this.logSub = this.expenseService.getExcelLog().subscribe(log =>{
      this.logs = log
    });
  }

  deleteSub!: Subscription;
  private snackBar = inject(MatSnackBar);
  deleteLog(id: number){
      this.deleteSub = this.invoiceService.deleteExcelLog(id).subscribe(log =>{
        this.getLog()
        this.snackBar.open('ExcelLog deleted successfully...', '', { duration: 3000 });
        
      })
  }
}
