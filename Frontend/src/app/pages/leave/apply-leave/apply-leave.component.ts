import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeaveService } from '../../../services/leave.service';
import { CommonModule, formatDate } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SafePipe } from '../../add-approval/view-invoices/safe.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';
import { MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';

@Component({
  selector: 'app-apply-leave',
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
    MatDatepickerModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
  templateUrl: './apply-leave.component.html',
  styleUrls: ['./apply-leave.component.scss']
})
export class ApplyLeaveComponent implements OnInit {
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

  ngOnInit() {
    this.getLeaveType();
  }

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
        session2: [false],
      });
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

    // Log the leave request to see if it includes session values
    console.log('Leave Request:', leaveRequest);

    this.leaveService.addLeave(leaveRequest).subscribe(
      (response: any) => {
        console.log(response);
        this.isLoading = false;
      },
      (error: any) => {
        console.error(error);
        this.isLoading = false;
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
}
