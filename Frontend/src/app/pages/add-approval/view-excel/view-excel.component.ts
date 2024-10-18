import { Component, inject, OnInit } from '@angular/core';
import { InvoiceService } from '@services/invoice.service';

import { SafePipe } from "../view-invoices/safe.pipe";
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-view-excel',
  standalone: true,
  imports: [SafePipe],
  templateUrl: './view-excel.component.html',
  styleUrl: './view-excel.component.scss'
})
export class ViewExcelComponent implements OnInit {
  excelUrl: SafeResourceUrl;
  ngOnInit(): void {
    const fileUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/PaymentExcel/2024-10-17.xlsx';
    this.excelUrl = this.sanitizeUrl(fileUrl);
  }

  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  invoiceService = inject(InvoiceService);
  private sanitizer = inject(DomSanitizer);

  async downloadExcel(): Promise<void> {
    const fileUrl = 'https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/PaymentExcel/2024-10-17.xlsx'; // Your file URL
    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Get the response as a Blob
      const blob = await response.blob();

      // Create a URL for the Blob
      const url = window.URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement('a');
      link.href = url;

      // Set the filename and file type
      link.download = 'PaymentExcel_2024-10-17.xlsx'; // Ensure the filename ends with .xlsx
      document.body.appendChild(link);

      // Programmatically click the link to trigger the download
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  }



}
