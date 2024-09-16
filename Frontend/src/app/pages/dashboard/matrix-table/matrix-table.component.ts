import { InvoiceService } from '@services/invoice.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ViewApprovalComponent } from '../../add-approval/view-approval/view-approval.component';
import { ViewInvoicesComponent } from '../../add-approval/view-invoices/view-invoices.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-matrix-table',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatPaginatorModule,
  ],
  templateUrl: './matrix-table.component.html',
  styleUrl: './matrix-table.component.scss'
})
export class MatrixTableComponent implements OnInit, OnDestroy{
  invoiceServices = inject(InvoiceService)
  router = inject(Router)

  ngOnInit(): void {
    this.getPi();
  }

  invoices: PerformaInvoice[] = [];
  piSub!: Subscription;
  getPi(){
    this.piSub = this.invoiceServices.getPI(this.searchText, this.currentPage, this.pageSize).subscribe((invoice: any) => {
      console.log(invoice);
      this.invoices = invoice.items
      this.totalItems = invoice.count;
    });
  }

  public searchText!: string;
  search(){
    console.log(this.searchText);
    this.getPi()
  }

  ngOnDestroy(): void {
    this.piSub?.unsubscribe()
  }

  pageSize = 1;
  currentPage = 1;
  totalItems = 0;
  public onPageChanged(event: any){
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getPi()
  }

  openInvoice(id: number){
    this.router.navigateByUrl('/login/viewInvoices/' + id);
  }

  onMouseEnter(event: MouseEvent): void {
    (event.target as HTMLElement).style.color = '#011b36'; // Change color on hover
  }

  onMouseLeave(event: MouseEvent): void {
    (event.target as HTMLElement).style.color = '#007bff'; // Revert color on leave
  }

}
