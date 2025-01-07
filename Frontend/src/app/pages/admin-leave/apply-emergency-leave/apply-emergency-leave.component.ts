/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
import { Subscription } from 'rxjs';
import { UsersService } from '@services/users.service';
import { MatChipsModule } from '@angular/material/chips';
import { UserLeave } from '../../../common/interfaces/leaves/userLeave';
import { User } from '../../../common/interfaces/users/user';
import { MatNativeDateModule } from '@angular/material/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

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
function sessionSelectionValidator(group: FormGroup) {
  const session1 = group.get('session1')?.value;
  const session2 = group.get('session2')?.value;

  return (session1 || session2) ? null : { sessionRequired: true };
}

@Component({
  selector: 'app-apply-emergency-leave',
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
    MatChipsModule,
    MatNativeDateModule,
    MatDatepickerModule
],
  templateUrl: './apply-emergency-leave.component.html',
  styleUrl: './apply-emergency-leave.component.scss',
  providers: [ provideMomentDateAdapter(MY_FORMATS), DatePipe ]
})

export class ApplyEmergencyLeaveComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.usersSub?.unsubscribe();
    this.employeeSub?.unsubscribe();
    this.submit?.unsubscribe();
    this.leaveTypeSub?.unsubscribe();

    this.leaveSub?.unsubscribe();
    this.ulSub?.unsubscribe();
  }

  private fb = inject(FormBuilder)
  leaveRequestForm = this.fb.group({
    userId: ['', Validators.required],
    leaveTypeId: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    notes: ['', Validators.required],
    fileUrl:[''],
    leaveDates: this.fb.array([]),
  });

  isEditMode: boolean = false;
  private route = inject(ActivatedRoute)
  ngOnInit() {
    this.getUsers()
    this.getLeaveType();
    const leaveId = this.route.snapshot.params['id'];
    if (leaveId) {
      this.isEditMode = true;
      this.getLeaveDetails(+leaveId)
    }
  }

  leave : any
  userId : number

  get leaveDates(): FormArray {
    return this.leaveRequestForm.get('leaveDates') as FormArray;
  }

  


  usersSub!: Subscription;
  Users: User[] = [];
  private userService = inject(UsersService)
  getUsers(){
    this.usersSub = this.userService.getUser().subscribe(res=>{
      this.Users = res;
    })
  }

  leaveTypeSub!: Subscription;
  leaveTypes: any[] = [];
  private leaveService = inject(LeaveService)
  getLeaveType() {
    this.leaveTypeSub = this.leaveService.getLeaveType().subscribe( (leaveTypes: any) => {
        this.leaveTypes = leaveTypes;
      },(error) => {
        console.error('Error fetching leave types:', error);
      }
    );
  }

  private employeeSub!: Subscription;
  checkProbationStatus(id: number) {
     this.getLeaveType()
     this.getUserLeaves(id)
     this.employeeSub = this.userService.getProbationEmployees().subscribe((employees) => {
       const isProbationEmployee = employees.some((emp: any) => emp.id === id);
       if (isProbationEmployee) {
         const id = this.leaveTypes.find(type => type.leaveTypeName === 'LOP').id
         this.leaveTypes = this.leaveTypes.filter(type => type.leaveTypeName === 'LOP');
         this.leaveRequestForm.get('leaveTypeId')?.setValue(id)
       }
     });
  }

  endDateFilter = (date: Date | null): boolean => {
    if (!date || !this.minEndDate) {
      return false;
    }
    return date >= this.minEndDate; // Only allow dates after the minimum date
  };

  minEndDate: Date | null = null;
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

  emergencyPrefix = 'Emergency: ';
  prefixEmergency(): void {
    const notesControl = this.leaveRequestForm.get('notes');
    if (notesControl && !notesControl.value?.startsWith(this.emergencyPrefix)) {
      notesControl.setValue(this.emergencyPrefix + notesControl.value);
    }
  }


  // validateDateRange(): boolean {
  //   const startDate = this.leaveRequestForm.get('startDate')!.value;
  //   const endDate = this.leaveRequestForm.get('endDate')!.value;
  //   return new Date(startDate) <= new Date(endDate);
  // }

  updateLeaveDates(start: Date, end: Date) {
    const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
    leaveDatesArray.clear();

    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const leaveDateGroup = this.fb.group({
        date: [formatDate(dt, 'yyyy-MM-dd', 'en-US')], session1: [false], session2: [false]
      }, { validators: sessionSelectionValidator });

      leaveDatesArray.push(leaveDateGroup);
    }
  }


  onSessionChange(index: number, session: string) {
    const leaveDateGroup = this.leaveDates.at(index) as FormGroup;
    const currentValue = leaveDateGroup.get(session)?.value;
    leaveDateGroup.get(session)?.setValue(!currentValue);
  }

  leaveSub!: Subscription;
  getLeaveDetails(id: number) {
    this.leaveSub = this.leaveService.getLeaveById(id).subscribe((leave) => {
      this.leave = leave;
      this.leaveRequestForm.patchValue({
        userId: this.leave.userId,
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

  submit!: Subscription;
  isLoading = false;
  private snackBar = inject(MatSnackBar);
  private router = inject(Router)
  onSubmit() {
    this.isLoading = true;
    const leaveRequest = {
      ...this.leaveRequestForm.value,
      leaveDates: this.leaveRequestForm.get('leaveDates')!.value
    };
    if (this.isEditMode) {
      this.submit = this.leaveService.updatemergencyLeave(leaveRequest, this.leave.id).subscribe(() => {
        this.router.navigateByUrl('/login/admin-leave/view-leave-request')
        this.snackBar.open("Emergency leave updated succesfully...","" ,{duration:3000})
      });
    } else {
      this.submit = this.leaveService.addEmergencyLeave(leaveRequest).subscribe(() => {
        this.router.navigateByUrl('/login/admin-leave/view-leave-request')
        this.snackBar.open("Emergency leave added succesfully...","" ,{duration:3000})
      });
    }
  }



  uploadProgress: number | null = null;
  file!: File;
  imageUrl: string = '';
  fileName: string = ''; // Holds the name of the file
  isFileSelected: boolean = false;
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png'];

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0]; 
    const fileType: any = selectedFile?.type.split('/')[1];
    if (!this.allowedFileTypes.includes(fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, or PNG file.');
      return;
    }

    if (selectedFile) { // Check if a file was selected
      this.file = selectedFile; // Assign the file
      this.fileName = this.file.name; // Store the file name
      this.isFileSelected = true; // Set the selected state to true
      this.leaveService.uploadImage(this.file).subscribe({
        next: (res) => {
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.leaveRequestForm.get('fileUrl')?.setValue(res.fileUrl);
        },
        error: () => console.error('Upload failed'),
      });
    } else {
      this.fileName = ''; // Reset the file name if no file is selected
      this.isFileSelected = false; // Reset the selected state
    }
  }


  // Method to check if the selected leave is sick leave and duration is more than 3 days
  isSickLeaveAndMoreThanThreeDays(): boolean {
    const leaveTypeId = this.leaveRequestForm.get('leaveTypeId')?.value;
    const startDate = this.leaveRequestForm.get('startDate')?.value;
    const endDate = this.leaveRequestForm.get('endDate')?.value;

    const sickLeaveTypeId = this.leaveTypes.find(type => type.leaveTypeName === 'Sick Leave')?.id;

    if (leaveTypeId === sickLeaveTypeId && startDate && endDate) {
      const duration = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1; // Calculate the duration in days
      return duration > 3; 
    }
    return false; // Return false if it's not sick leave or dates are invalid
  }

  ulSub!: Subscription;
  userLeaves: UserLeave[] = [];
  getUserLeaves(id: number){
    this.ulSub = this.leaveService.getUserLeaveByUser(id).subscribe((response: any) => {
      this.userLeaves = response;
    });
  }

}

