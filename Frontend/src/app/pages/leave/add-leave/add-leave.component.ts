import { CommonModule, formatDate } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LeaveService } from '@services/leave.service';
import { SafePipe } from '../../add-approval/view-invoices/safe.pipe';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { SafeResourceUrl } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
// Custom validator to check if at least one session is selected
function sessionSelectionValidator(group: FormGroup) {
  const session1 = group.get('session1')?.value;
  const session2 = group.get('session2')?.value;

  return (session1 || session2) ? null : { sessionRequired: true };
}
@Component({
  selector: 'app-add-leave',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    SafePipe,
    MatDatepickerModule,
    MatTableModule,
    MatSnackBarModule
  ],
  templateUrl: './add-leave.component.html',
  styleUrl: './add-leave.component.scss',
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
})
export class AddLeaveComponent {
  isEditMode: boolean = false;

  leaveRequestForm: FormGroup;
  leaveTypes: any[] = [];
  isLoading = false;


snackBar = inject(MatSnackBar);
router = inject(Router)
route = inject(ActivatedRoute)
fb = inject(FormBuilder)
leaveService = inject(LeaveService)
sanitizer = inject(DomSanitizer);

leave : any

  ngOnInit() {
    this.getLeaveType();
    this.getLeaves()

const leaveId = this.route.snapshot.queryParamMap.get('id');
if (leaveId) {
  this.isEditMode = true;
  this.leaveService.getLeaveById(+leaveId).subscribe((response: any) => {
    this.leave = response;


    this.leaveRequestForm.patchValue({
      leaveTypeId: this.leave.leaveTypeId,
      startDate: this.leave.startDate,
      endDate: this.leave.endDate,
      notes: this.leave.notes
    });


    const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
    leaveDatesArray.clear();
    this.leave.leaveDates.forEach((leaveDate: any) => {
      leaveDatesArray.push(this.fb.group({
        date: [leaveDate.date],
        session1: [leaveDate.session1],
        session2: [leaveDate.session2]
      }));
    });
  });
}


this.leaveRequestForm = this.fb.group({
  leaveTypeId: ['', Validators.required],
  startDate: ['', Validators.required],
  endDate: ['', Validators.required],
  notes: ['', Validators.required],
  fileUrl:[''],
  leaveDates: this.fb.array([]),
});


  }
  displayedColumns: string[] = ['leaveType', 'startDate', 'endDate', 'reason', 'session'];
  get leaveDates(): FormArray {
    return this.leaveRequestForm.get('leaveDates') as FormArray;
  }

  onDateChange() {
    const startDate = this.leaveRequestForm.get('startDate')!.value;
    const endDate = this.leaveRequestForm.get('endDate')!.value;

    if (startDate && endDate && this.validateDateRange()) {
      this.updateLeaveDates(new Date(startDate), new Date(endDate));
    }
  }

  validateDateRange(): boolean {
    const startDate = this.leaveRequestForm.get('startDate')!.value;
    const endDate = this.leaveRequestForm.get('endDate')!.value;
    return new Date(startDate) <= new Date(endDate);
  }

  updateLeaveDates(start: Date, end: Date) {
    const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
    leaveDatesArray.clear();

    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const leaveDateGroup = this.fb.group({
        date: [formatDate(dt, 'yyyy-MM-dd', 'en-US')],
        session1: [false],
        session2: [false]
      }, { validators: sessionSelectionValidator });

      leaveDatesArray.push(leaveDateGroup);
    }
  }


  onSessionChange(index: number, session: string) {
    const leaveDateGroup = this.leaveDates.at(index) as FormGroup;
    const currentValue = leaveDateGroup.get(session)?.value;
    leaveDateGroup.get(session)?.setValue(!currentValue);
    console.log(`Checkbox ${session} for date ${leaveDateGroup.get('date')?.value} changed to:`, !currentValue);
  }


  onSubmit1() {
    this.isLoading = true;
    const leaveRequest = {
      ...this.leaveRequestForm.value,
      leaveDates: this.leaveRequestForm.get('leaveDates')!.value
    };

    this.leaveService.addLeave(leaveRequest).subscribe(
      () => {
        this.isLoading = false;
        this.snackBar.open('Leave request submitted successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/login/applyLeave'])
      },
      () => {
        this.isLoading = false;
        this.snackBar.open('Failed to submit leave request. Please try again.', 'Close', { duration: 3000 });
      }
    );
  }


  getLeaveDetails(id: number) {
    this.leaveService.getLeaveById(id).subscribe((leave) => {
      this.leave = leave;
    });
  }

  onSubmit() {
    this.isLoading = true;
    const leaveRequest = {
      ...this.leaveRequestForm.value,
      leaveDates: this.leaveRequestForm.get('leaveDates')!.value
    };

    const leaveId = this.route.snapshot.queryParamMap.get('id');

    if (this.isEditMode && leaveId) {

      const idAsNumber = +leaveId;

      this.leaveService.updateLeave(idAsNumber, leaveRequest).subscribe(() => {
        this.snackBar.open('Leave request Updated successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/login/leave'])
      });
    } else {
      this.leaveService.addLeave(leaveRequest).subscribe(() => {
        this.snackBar.open('Leave request added successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/login/leave'])
      });
    }
  }



  getLeaveType() {
    this.leaveService.getLeaveType().subscribe(
      (leaveTypes: any) => {
        this.leaveTypes = leaveTypes;
      },
      (error) => {
        console.error('Error fetching leave types:', error);
      }
    );
  }

  getLeaveSub : Subscription
  getLeaves(){
       this.getLeaveSub= this.leaveService.getLeaves().subscribe((res)=>{
         })
  }

  uploadProgress: number | null = null;
  file!: File;
  imageUrl!: string;
  fileName: string = ''; // Holds the name of the file
  isFileSelected: boolean = false; // Track if a file is selected

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0]; // Get the first file if it exists

    if (selectedFile) { // Check if a file was selected
      this.file = selectedFile; // Assign the file
      this.fileName = this.file.name; // Store the file name
      this.isFileSelected = true; // Set the selected state to true
      this.leaveService.uploadImage(this.file).subscribe({
        next: (res) => {
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.leaveRequestForm.get('url')?.setValue(res.fileUrl);
        },
        error: () => console.error('Upload failed'),
      });
    } else {
      console.warn('No file selected'); // Handle the case where no file was selected
      this.fileName = ''; // Reset the file name if no file is selected
      this.isFileSelected = false; // Reset the selected state
    }
  }




  }


