/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MY_FORMATS } from '../../users/personal-details/personal-details.component';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Holidays } from '../../../common/interfaces/leaves/holidays';
import { MatButtonModule } from '@angular/material/button';
import { HolidayService } from '@services/holiday.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-add-holiday',
  standalone: true,
  imports: [MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatDatepickerModule, MatInputModule,
    MatButtonModule, MatDialogModule, MatTabsModule
  ],
  templateUrl: './add-holiday.component.html',
  styleUrl: './add-holiday.component.scss',
  providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
})
export class AddHolidayComponent implements OnInit, OnDestroy{
  private readonly dialogRef = inject(MatDialogRef<AddHolidayComponent>)
  private readonly data = inject(MAT_DIALOG_DATA);
  ngOnInit(): void {
    if(this.data){
      this.patch(this.data)
    }
  }

  editStatus: boolean = false;
  patch(data: Holidays){
    this.editStatus = true;
    this.holidayForm.patchValue({
      name: data.name,
      date: data.date,
      comments: data.comments,
      type: data.type,
    })
  }


  private readonly fb = inject(FormBuilder);
  holidayForm = this.fb.group({
    name: ['', Validators.required],
    date: <any>[''],
    comments:[''],
    type:['']
  });

  uploadForm = this.fb.group({

  });


  private readonly holidayService = inject(HolidayService);
  private submit: Subscription;
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe)
  onSubmit(){
    const data = {
      ...this.holidayForm.getRawValue(),
    }
    const date: any = this.holidayForm.get('date')?.value;
    data.date = this.datePipe.transform(date, 'yyyy-MM-dd')
    if(this.editStatus){
      this.submit = this.holidayService.updateHolidays(this.data.id, this.holidayForm.getRawValue()).subscribe(() => {
        this.snackBar.open("Holiday updated successfully...","" ,{duration:3000})
      });
    }else{
      this.submit = this.holidayService.addHolidays(data).subscribe(() => {
        this.snackBar.open("Holiday added successfully...","" ,{duration:3000})
      });
    }
  }

  fileSelected: boolean = false;
  uploadError: string | null = null;
  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.fileSelected = true;
      this.uploadError = null;
    } else {
      this.fileSelected = false;
      this.uploadError = 'Please select a valid file.';
    }
  }
  onUpload() {
    if (this.fileSelected) {
      // Upload logic
      console.log('File uploaded successfully!');
    }
  }

  selectedFile: File | null = null;
  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      this.snackBar.open('No file selected.', 'Close', { duration: 3000 });
      return;
    }
  
    const validMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (file.type !== validMimeType) {
      this.snackBar.open('Invalid file type. Please select a valid Excel file (.xlsx).', 'Close', { duration: 3000 });
      event.target.value = ''; // Clear the file input
      this.selectedFile = null;
      return;
    }
  
    this.selectedFile = file;
    this.snackBar.open('File selected successfully.', 'Close', { duration: 3000 });
    this.readExcelFile(file);
  }

  excelData: any[] = [];
  readExcelFile(file: File): void {
    const reader = new FileReader();

    reader.onload = (event: any) => {
      const binaryData = event.target.result;
      const workbook = XLSX.read(binaryData, { type: 'binary' });

      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const sheet = workbook.Sheets[sheetName];
      this.excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); 
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.snackBar.open('Error reading the file.', 'Close', { duration: 3000 });
    };

    reader.readAsBinaryString(file); // Read file as binary string
  }
  
  uploadFile() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      this.holidayService.uploadHolidays(formData).subscribe(() => {
        this.snackBar.open("Holiday uploaded successfully...", "", { duration: 3000 });
        this.resetPage()
      })
    } else {
      this.snackBar.open('No file selected.', 'Close', { duration: 3000 });
    }
  }

  resetPage() {
    this.selectedFile = null;
    this.holidayForm.reset();
  }
  

  ngOnDestroy(): void {
    this.submit?.unsubscribe();
  }

}
