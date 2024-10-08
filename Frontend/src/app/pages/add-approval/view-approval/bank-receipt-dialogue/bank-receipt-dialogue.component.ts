import { Component, ElementRef, Inject, Optional, ViewChild } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-bank-receipt-dialogue',
  standalone: true,
  imports: [  MatToolbarModule,
    MatProgressBarModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatDividerModule,
    RouterModule,
    MatCardModule,
    CommonModule],
  templateUrl: './bank-receipt-dialogue.component.html',
  styleUrl: './bank-receipt-dialogue.component.scss'
})
export class BankReceiptDialogueComponent {

  constructor(private invoiceService: InvoiceService, private fb: FormBuilder, private snackBar: MatSnackBar, private router: Router,
    public dialog: MatDialog, @Optional() public dialogRef: MatDialogRef<BankReceiptDialogueComponent>, @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any  ){}

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
  }

  piNo!: string;
  ngOnInit(): void {
    this.piNo = this.dialogData.invoiceNo;
  }

  piForm = this.fb.group({
    bankSlip: ['', Validators.required]
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
  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0];
    this.uploadComplete = true;

    if (this.file) {
      let fileName = this.file.name
      if(fileName.length > 12){
        let splitName = fileName.split('.');
        fileName = splitName[0].substring(0, 12) + "... ." + splitName[1];
      }

      this.uploadSub = this.invoiceService.uploadInvoice(this.file).subscribe(invoice => {
        this.piForm.get('bankSlip')?.setValue(invoice.fileUrl)
        this.uploadComplete = false;
      })

    }
  }

  submit!: Subscription;
  onSubmit() {
    this.submit = this.invoiceService.addBankSlip(this.piForm.getRawValue(), this.dialogData.id).subscribe((invoice: any) =>{
      this.dialogRef.close(true);
      window.location.reload(); 
    });

  }

  onCancelClick(): void {
    this.dialogRef.close();
  }
}
