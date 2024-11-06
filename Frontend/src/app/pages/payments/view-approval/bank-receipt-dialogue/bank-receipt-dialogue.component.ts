/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon'; 
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-bank-receipt-dialogue',
  standalone: true,
  imports: [  MatToolbarModule, MatProgressBarModule, MatIconModule, MatPaginatorModule, MatSortModule,
    MatDividerModule, RouterModule, MatCardModule ],
  templateUrl: './bank-receipt-dialogue.component.html',
  styleUrl: './bank-receipt-dialogue.component.scss'
})
export class BankReceiptDialogueComponent {
  public dialogContent: string;

  invoiceService=inject(InvoiceService)
  fb=inject(FormBuilder)
  snackBar=inject(MatSnackBar)
  router=inject(Router)
  dialog=inject(MatDialog)
  dialogRef = inject(MatDialogRef<BankReceiptDialogueComponent>)
  dialogData = inject(MAT_DIALOG_DATA);

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
  }

  piNo!: string;
  ngOnInit(): void {
    this.piNo = this.dialogData.invoiceNo;
    if (this.dialogData.status === 'AM APPROVED') {
      this.dialogContent = 'Upload the credit card payment slip';
    } else {
      this.dialogContent = 'Upload the bank slip';
    }
  }

  piForm = this.fb.group({
    bankSlip: ['', Validators.required],
    status: [this.dialogData.status]
  });

  @ViewChild('form') form!: ElementRef<HTMLFormElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('progressArea') progressArea!: ElementRef<HTMLElement>;
  @ViewChild('uploadArea') uploadArea!: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    this.form.nativeElement.addEventListener('click', () => {
      this.fileInput.nativeElement.click();
    });

    this.fileInput.nativeElement.addEventListener('change', (e: Event) => {
      this.uploadFile(e)
    });
  }

  uploadProgress: number | null = null;
  uploadComplete: boolean = false;
  file!: any;
  uploadSub!: Subscription;
  fileType: string;
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png', 'docx', 
    'vnd.openxmlformats-officedocument.wordprocessingml.document', 'plain'];
  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.fileType = this.file.type.split('/')[1]
    
    if (!this.allowedFileTypes.includes(this.fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, DOCX, TXT or PNG file.');
      return;
    }
    this.uploadComplete = true;

    if (this.file) {
      let fileName = this.file.name

      if(fileName.length > 12){
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "...." + splitName[1];
      }
      this.uploadSub = this.invoiceService.uploadBankSlip(this.file).subscribe(invoice => {
        this.piForm.get('bankSlip')?.setValue(invoice.fileUrl)
        this.uploadComplete = false;
      })

    }
  }

  submit!: Subscription;
  onSubmit() {
    this.submit = this.invoiceService.addBankSlip(this.piForm.getRawValue(), this.dialogData.id).subscribe(() =>{
      this.dialogRef.close(true);
    });

  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}
