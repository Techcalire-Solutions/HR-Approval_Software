import { InvoiceService } from '@services/invoice.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-matrix-table',
  standalone: true,
  imports: [
     MatCardModule, MatPaginatorModule,
  ],
  templateUrl: './matrix-table.component.html',
  styleUrl: './matrix-table.component.scss'
})
export class MatrixTableComponent implements OnInit, OnDestroy{
  invoiceServices = inject(InvoiceService)
  router = inject(Router)

  ngOnInit(): void {
    this.getCCPi();
    this.getWTPi();
  }

  checkStatus(item: any, statusesToCheck: string | string[]): boolean {
    const statusesArray = Array.isArray(statusesToCheck) ? statusesToCheck : [statusesToCheck];
    return item?.performaInvoiceStatuses?.some((status: any) => statusesArray.includes(status.status));
  }

  // isRejected(item: any): boolean {
  //   return this.checkStatus(item, 'REJECTED');
  // }

  isGenerated(item: any, status: string | string[]): boolean {
    return this.checkStatus(item, status);
  }

  // isKamVerified(item: any): boolean {
  //   return this.checkStatus(item, 'KAM VERIFIED');
  // }

  // isAccountantVerified(item: any): boolean {
  //   return this.checkStatus(item, 'ACCOUNTANT VERIFIED');
  // }

  invoices: PerformaInvoice[] = [];
  piSub!: Subscription;
  getCCPi(){
    this.piSub = this.invoiceServices.getDashboardCCPI(this.searchText, this.currentPage, this.pageSize).subscribe((invoice: any) => {
      this.invoices = invoice.items
      this.totalItems = invoice.count;
    });
  }

  wtInvoices: PerformaInvoice[] = [];
  wtpiSub!: Subscription;
  getWTPi(){
    this.wtpiSub = this.invoiceServices.getDashboardWTPI(this.searchText, this.wtCurrentPage, this.wtPageSize).subscribe((invoice: any) => {
      console.log(invoice);
      
      this.wtInvoices = invoice.items
      this.wtTotalItems = invoice.count;
    });
  }


  public searchText!: string;
  search(){
    this.getWTPi()
  }

  ngOnDestroy(): void {
    this.piSub?.unsubscribe()
  }

  pageSize = 5;
  currentPage = 1;
  totalItems = 0;
  public onPageChanged(event: any){
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getCCPi()
  }

  wtPageSize = 5;
  wtCurrentPage = 1;
  wtTotalItems = 0;
  public onPageChangedWT(event: any){
    this.wtCurrentPage = event.pageIndex + 1;
    this.wtPageSize = event.pageSize;
    this.getWTPi()
  }

  openInvoice(id: number){
    this.router.navigateByUrl('/login/viewInvoices/' + id);
  }

  onMouseEnter(event: MouseEvent): void {
    (event.target as HTMLElement).style.color = '#011b36'; 
  }

  onMouseLeave(event: MouseEvent): void {
    (event.target as HTMLElement).style.color = '#007bff';
  }

}
