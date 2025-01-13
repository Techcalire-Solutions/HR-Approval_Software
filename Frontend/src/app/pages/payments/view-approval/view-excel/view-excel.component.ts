import { Component, inject, OnInit } from '@angular/core';
import { InvoiceService } from '@services/invoice.service';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { SafePipe } from '../../../../common/pipes/safe.pipe';

@Component({
  selector: 'app-view-excel',
  standalone: true,
  imports: [SafePipe, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule],
  templateUrl: './view-excel.component.html',
  styleUrl: './view-excel.component.scss',
  providers: [DatePipe]
})
export class ViewExcelComponent implements OnInit {
  excelUrl: SafeResourceUrl;
  datePipe = inject(DatePipe);
  ngOnInit(): void {
    this.newDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.getExcel(this.newDate)
  }

  newDate: any
  onDateChange(event: any): void {
    const selectedDate = event.value;
    this.newDate = this.datePipe.transform(selectedDate, 'yyyy-MM-dd');
    this.getExcel(this.newDate)
  }

  getExcel(date: any) {
    const rawFileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/PaymentExcel/${date}.xlsx?cache-bust=${new Date().getTime()}`;

    // const rawFileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/PaymentExcel/${date}.xlsx`;
    const fileUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawFileUrl)}`;
    this.excelUrl = this.sanitizeUrl(fileUrl);
  }
  
  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  invoiceService = inject(InvoiceService);
  private sanitizer = inject(DomSanitizer);

  async downloadExcel(): Promise<void> {
    const fileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/PaymentExcel/${this.newDate}.xlsx`; // Your file URL
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
      link.download = 'PaymentExcel_2024-10-17.xlsx'; 
      document.body.appendChild(link);

      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  }



}
