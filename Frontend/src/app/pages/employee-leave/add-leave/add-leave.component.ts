import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { LeaveCountCardsComponent } from '../leave-count-cards/leave-count-cards.component';
import { UsersService } from '@services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { LeaveInfoDialogComponent } from '../leave-info-dialog/leave-info-dialog.component';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
// Custom validator to check if at least one session is selected
function sessionSelectionValidator(group: FormGroup) {
  const session1 = group.get('session1')?.value;
  const session2 = group.get('session2')?.value;

  return (session1 || session2) ? null : { sessionRequired: true };
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Change to desired format
  },
  display: {
    dateInput: 'DD/MM/YYYY', // Display format for the input field
    monthYearLabel: 'MMM YYYY', // Format for month/year in the header
    dateA11yLabel: 'DD/MM/YYYY', // Accessibility format for dates
    monthYearA11yLabel: 'MMMM YYYY', // Accessibility format for month/year
  },
};
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
    MatDatepickerModule,
    MatTableModule,
    MatSnackBarModule,
    LeaveCountCardsComponent
  ],
  templateUrl: './add-leave.component.html',
  styleUrl: './add-leave.component.scss',
  providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
})
export class AddLeaveComponent implements OnInit, OnDestroy {


  isEditMode: boolean = false;
  leaveRequestForm: FormGroup;
  fb = inject(FormBuilder)
  leaveTypes: any[] = [];
  isLoading = false;
  snackBar = inject(MatSnackBar);
  router = inject(Router)
  route = inject(ActivatedRoute)
  leaveService = inject(LeaveService)
  sanitizer = inject(DomSanitizer);
  userService = inject(UsersService);
  dialog = inject(MatDialog);
  leave: any
  userId: number


  ngOnInit() {
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    this.userId = user.id;
    this.checkProbationStatus()

    const leaveId = this.route.snapshot.queryParamMap.get('id');
    if (leaveId) {
      this.isEditMode = true;
      this.leaveService.getLeaveById(+leaveId).subscribe((response: any) => {
        this.leave = response;

        this.leaveRequestForm.patchValue({
          leaveTypeId: this.leave.leaveTypeId,
          startDate: this.leave.startDate,
          endDate: this.leave.endDate,
          notes: this.leave.notes,
          fileUrl: this.leave.fileUrl,
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
      fileUrl: [''],
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

  //   if (startDate && endDate && this.validateDateRange()) {
  //     this.updateLeaveDates(new Date(startDate), new Date(endDate));
  //   }
  // }


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


    const request$ = this.isEditMode && leaveId
      ? this.leaveService.updateLeave(+leaveId, leaveRequest)
      : this.leaveService.addLeave(leaveRequest);


    request$.subscribe(
      (response: any) => {

        this.openDialog(response.message, response.leaveDatesApplied, response.lopDates);
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.snackBar.open('An error occurred while submitting the leave request.', 'Close', { duration: 3000 });
      }
    );
  }


  openDialog(message: string, leaveDatesApplied: any[], lopDates: any[]) {
    const dialogRef = this.dialog.open(LeaveInfoDialogComponent, {
      data: {
        message: message,
        leaveDatesApplied: leaveDatesApplied,
        lopDates: lopDates
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.handleDialogResult(result);
    });
  }



  handleDialogResult(result: any) {
    if (result?.action === 'proceed') {

      this.snackBar.open('Leave request submitted successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/login/employee-leave']);
    } else if (result?.action === 'back') {

      this.isLoading = false;

    } else if (result?.action === 'cancel') {

      this.isLoading = false;
      this.leaveRequestForm.reset();
      this.snackBar.open('Leave request cancelled!', 'Close', { duration: 3000 });
      this.router.navigate(['/login/employee-leave']);
    }
  }
}

minEndDate: Date | null = null;
endDateFilter = (date: Date | null): boolean => {
  if (!date || !this.minEndDate) {
    return false;
  }
  return date >= this.minEndDate;
}

onDateChange() {
  const startDate = this.leaveRequestForm.get('startDate')!.value;
  const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
  leaveDatesArray.clear();
  this.leaveRequestForm.get('endDate')?.reset();
  if (startDate) {
    this.minEndDate = new Date(startDate);
    this.minEndDate.setDate(this.minEndDate.getDate() + 1); 
  }
}

onEndDateChange() {
  const startDate = this.leaveRequestForm.get('startDate')!.value;
  const endDate = this.leaveRequestForm.get('endDate')!.value;
  if (startDate && endDate) {
    this.updateLeaveDates(new Date(startDate), new Date(endDate));
  }
}


  uploadProgress: number | null = null;
  file!: File;
  imageUrl!: string;
  fileName: string = '';
  isFileSelected: boolean = false;

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      this.file = selectedFile;
      this.fileName = this.file.name;
      this.isFileSelected = true;
      this.leaveService.uploadImage(this.file).subscribe({
        next: (res) => {
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.leaveRequestForm.get('url')?.setValue(res.fileUrl);
        },
        error: () => console.error('Upload failed'),
      });
    } else {
      this.fileName = '';
      this.isFileSelected = false;
    }
  }




  isSickLeave(): boolean {
    const leaveTypeId = this.leaveRequestForm.get('leaveTypeId')?.value;
    const sickLeaveTypeId = this.leaveTypes.find(type => type.leaveTypeName === 'Sick Leave')?.id;
    return leaveTypeId === sickLeaveTypeId;
  }



  isProbationEmployee: boolean = false;
  checkProbationStatus() {
    this.leaveService.getLeaveType().subscribe(
      (leaveTypes: any) => {
        this.leaveTypes = leaveTypes;

      },
      (error) => {
        console.error('Error fetching leave types:', error);
      }
    );

    this.userService.getProbationEmployees().subscribe((employees) => {
      this.isProbationEmployee = employees.some((emp: any) => emp.id === this.userId);
      if (this.isProbationEmployee) {
        this.leaveTypes = this.leaveTypes.filter(type => type.leaveTypeName === 'LOP');


      }
      else {
        this.leaveTypes = this.leaveTypes
      }
    });
  }


  ngOnDestroy() {




  }

}
