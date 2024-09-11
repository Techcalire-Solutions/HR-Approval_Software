import { InvoiceService } from '@services/invoice.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';
import { PerformaInvoiceStatus } from '../../../common/interfaces/performa-invoice-status';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-matrix-table',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './matrix-table.component.html',
  styleUrl: './matrix-table.component.scss'
})
export class MatrixTableComponent implements OnInit, OnDestroy{
  invoiceServices = inject(InvoiceService)

  ngOnInit(): void {
    this.getPi();
  }

  invoices: PerformaInvoice[] = [];
  getPi(){
    this.invoiceServices.getPI().subscribe(invoice => {
      console.log(invoice);
      this.invoices = invoice
    });
  }

  ngOnDestroy(): void {
  }


}
