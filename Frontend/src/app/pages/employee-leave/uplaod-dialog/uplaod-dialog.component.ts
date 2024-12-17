import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LeaveService } from '@services/leave.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

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
  leaveService = inject(LeaveService);
  route = inject(ActivatedRoute);

  ngOnInit() {
    this.leaveId = this.route.snapshot.paramMap.get('leaveId') || '';  // Fetch leaveId from route if applicable
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
    @Inject(MAT_DIALOG_DATA) public data: { leaveId: string }  // Inject dialog data
  ) {
    this.leaveId = data.leaveId;
    console.log(this.leaveId) // Assign the passed leaveId
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

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      this.fileName = selectedFile.name;
      this.isFileSelected = true;

      // Upload the file using the leaveService
      this.leaveService.uploadImage(selectedFile).subscribe({
        next: (res) => {
          // Once the file is uploaded, we get the file URL
          const fileUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.imageUrl = fileUrl; // Ensure fileUrl is correctly assigned

          // Update the file URL in the form
          this.leaveRequestForm.get('fileUrl')?.setValue(fileUrl);

          console.log('File URL:', this.imageUrl);  // Check if fileUrl is logged
        },
        error: (err) => {
          console.error('File upload failed', err);
        }
      });
    }
  }


  onSubmit() {
    if (this.imageUrl) {
      // Pass the file URL back to the parent component
      this.dialogRef.close({ fileUrl: this.imageUrl });
    } else {
      // No file uploaded, close the dialog without a value
      this.dialogRef.close();
    }
  }


  uploadFileFromInput() {
    const fileInput: HTMLInputElement | null = document.querySelector('#fileInput');
    if (fileInput && fileInput.files?.length) {
      const event = { target: fileInput } as unknown as Event; // First cast to unknown and then to Event
      this.uploadFile(event); // Now pass the event with the target as fileInput
    }
  }


}
