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
import { Router } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
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
  today: Date = new Date();

  leaveRequestForm: FormGroup;
  leaveTypes: any[] = [];
  isLoading = false;

  constructor(private fb: FormBuilder, private leaveService: LeaveService) {
    this.leaveRequestForm = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      notes: ['', Validators.required],
      leaveDates: this.fb.array([]),
    });
  }
  snackBar = inject(MatSnackBar);
router = inject(Router)

  ngOnInit() {
    this.getLeaveType();
    this.getLeaves()
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
      }, { validators: sessionSelectionValidator }); // Apply validator correctly here

      leaveDatesArray.push(leaveDateGroup);
    }
  }


  onSessionChange(index: number, session: string) {
    const leaveDateGroup = this.leaveDates.at(index) as FormGroup;
    const currentValue = leaveDateGroup.get(session)?.value; // Get current value
    leaveDateGroup.get(session)?.setValue(!currentValue); // Toggle the value
    console.log(`Checkbox ${session} for date ${leaveDateGroup.get('date')?.value} changed to:`, !currentValue);
  }


  onSubmit() {
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

  goBack() {
    // Implement navigation back (e.g., using Angular Router)
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

  getLeaves(){
         this.leaveService.getLeaves().subscribe((res)=>{
          console.log(res)
         })
         }


  isDateBeforeToday(date: Date): boolean {
    return new Date(date).getTime() < this.today.getTime();
  }
  }


