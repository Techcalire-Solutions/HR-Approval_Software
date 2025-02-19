/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NewLeaveService } from '@services/new-leave.service';

@Component({
  selector: 'app-uplaod-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    MatIconModule
  ],
  templateUrl: './uplaod-dialog.component.html',
  styleUrls: ['./uplaod-dialog.component.scss']
})
export class UplaodDialogComponent {
  note: string = '';
  fb = inject(FormBuilder);
  leaveRequestForm: FormGroup;
  leaveService = inject(NewLeaveService);
  route = inject(ActivatedRoute);

  ngOnInit() {
    this.leaveId = this.route.snapshot.paramMap.get('leaveId') || '';  
    this.leaveRequestForm = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      notes: ['', Validators.required],
      fileUrl: [''],
      leaveDates: this.fb.array([]),
    });
  }

  constructor(
    public dialogRef: MatDialogRef<UplaodDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { leaveId: string }
  ) {
    this.leaveId = data.leaveId;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  uploadProgress: number | null = null;
  file!: File;
  imageUrl!: string;
  fileName: string = '';
  isFileSelected: boolean = false;
  leaveId: string = '';
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png'];

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];
    const fileType: any = selectedFile?.type.split('/')[1];
    if (!this.allowedFileTypes.includes(fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, or PNG file.');
      return;
    }

    if (selectedFile) {
      this.fileName = selectedFile.name;
      this.isFileSelected = true;


      this.leaveService.uploadImage(selectedFile).subscribe({
        next: (res) => {

          const fileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.imageUrl = fileUrl;


          this.leaveRequestForm.get('fileUrl')?.setValue(fileUrl);
        },
        error: (err) => {
          console.error('File upload failed', err);
        }
      });
    }
  }


  onSubmit() {
    if (this.imageUrl) {

      this.dialogRef.close({ fileUrl: this.imageUrl });
    } else {

      this.dialogRef.close();
    }
  }


  uploadFileFromInput() {
    const fileInput: HTMLInputElement | null = document.querySelector('#fileInput');
    if (fileInput && fileInput.files?.length) {
      const event = { target: fileInput } as unknown as Event;
      this.uploadFile(event);
    }
  }


}
