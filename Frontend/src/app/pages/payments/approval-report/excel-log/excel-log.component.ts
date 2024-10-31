import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs';
import { ExcelLog } from '../../../../common/interfaces/excel-log';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-excel-log',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, CommonModule, RouterModule],
  templateUrl: './excel-log.component.html',
  styleUrl: './excel-log.component.scss'
})
export class ExcelLogComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.logSub?.unsubscribe();
  }
  private invoiceService = inject(InvoiceService);
  ngOnInit(): void {
    this.getLog();
  }

  logSub!: Subscription;
  logs: ExcelLog[] = [];
  getLog(){
    this.logSub = this.invoiceService.getExcelLog().subscribe(log =>{
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
