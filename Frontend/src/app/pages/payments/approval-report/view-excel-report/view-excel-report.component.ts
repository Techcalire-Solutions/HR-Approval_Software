import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { InvoiceService } from '@services/invoice.service';
import { ActivatedRoute } from '@angular/router';
import { SafePipe } from '../../../../common/pipes/safe.pipe';

@Component({
  selector: 'app-view-excel-report',
  standalone: true,
  imports: [SafePipe, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule],
  templateUrl: './view-excel-report.component.html',
  styleUrl: './view-excel-report.component.scss',
  providers: [DatePipe]
})
export class ViewExcelReportComponent {
  private route = inject(ActivatedRoute);
  excelUrl: SafeResourceUrl;
  datePipe = inject(DatePipe);
  fileName: string;
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.fileName = params['name'];
      this.getExcel(this.fileName)
    });
  }
  
  getExcel(fileName: any) {
    const rawFileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${fileName}`;
    const fileUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawFileUrl)}`;
    this.excelUrl = this.sanitizeUrl(fileUrl);
  }
  
  sanitizeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  invoiceService = inject(InvoiceService);
  private sanitizer = inject(DomSanitizer);

  async downloadExcel(): Promise<void> {
    const fileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${this.fileName}`; // Your file URL
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
