/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SafePipe } from "../../../../common/safe.pipe";
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-bank-receipt-dialogue',
  standalone: true,
  imports: [MatToolbarModule, MatProgressBarModule, MatPaginatorModule, MatSortModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, RouterModule, MatCardModule, SafePipe],
  templateUrl: './bank-receipt-dialogue.component.html',
  styleUrl: './bank-receipt-dialogue.component.scss',
  encapsulation: ViewEncapsulation.None
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

  uploadProgress: number | null = null;
  uploadComplete: boolean = false;
  file!: any;
  uploadSub!: Subscription;
  fileType: string;
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png', 
    'vnd.openxmlformats-officedocument.wordprocessingml.document', 'plain'];
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }
  
  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    
    const files = event.dataTransfer?.files;
    
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }
  

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.processFile(file);
    }
  }

  imageUrl: string;
  processFile(file: File): void {
    const fileType = file.type.split('/')[1];
    
    if (!this.allowedFileTypes.includes(fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, TXT, or PNG file.');
      return;
    }

    this.uploadComplete = true;

    if (file) {
      let fileName = file.name
      if(fileName.length > 12){
        const splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "...." + splitName[1];
      }
      this.uploadSub = this.invoiceService.uploadBankSlip(file).subscribe(invoice => {
        this.piForm.get('bankSlip')?.setValue(invoice.fileUrl);
        this.imageUrl = `${invoice.fileUrl}`;
        this.uploadComplete = false;
      })
    }
  }

  onDeleteImage(){
    this.invoiceService.deleteBSUploadByurl(this.imageUrl).subscribe(()=>{
      this.imageUrl = '';
      this.snackBar.open("Document is deleted successfully...","" ,{duration:3000})
    });
  }

  submit!: Subscription;
  submitted: boolean = false;
  onSubmit() {
    this.submitted = true;
    this.submit = this.invoiceService.addBankSlip(this.piForm.getRawValue(), this.dialogData.id).subscribe(() =>{
      this.snackBar.open(`Bank Slip is uploaded successfully...`, "", { duration: 3000 });
      this.submitted = false;
      this.dialogRef.close(true);
    });
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}
