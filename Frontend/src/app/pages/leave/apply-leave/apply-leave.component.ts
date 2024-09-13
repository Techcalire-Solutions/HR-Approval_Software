
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeaveService } from '@services/leave.service';
import { CommonModule } from '@angular/common';
import {  ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
// import { MatDialog } from '@angular/material/dialog';
import { SafePipe } from '../../add-approval/view-invoices/safe.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
// import { LeaveService } from '@services/leave.service';
import { DatePipe } from '@angular/common';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatCheckboxModule } from '@angular/material/checkbox';
@Component({
  selector: 'app-apply-leave',
  standalone: true,
  providers: [DatePipe], // Add DatePipe here
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatCardModule,
    MatNativeDateModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule, SafePipe, MatCheckboxModule],
  templateUrl: './apply-leave.component.html',
  styleUrl: './apply-leave.component.scss'
})
export class ApplyLeaveComponent {
  editStatus: boolean = false;
  constructor(
    private formBuilder: FormBuilder, private datePipe: DatePipe,
    private leaveService: LeaveService,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);

    // this.therapistId = user.id;

    // this.userRole = user.role;
  }
  leaveRequestForm = this.formBuilder.group({
    leaveType: ['', Validators.required], // Add Validators.required here
    reason: ['', Validators.required], // Add Validators.required here
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required],
    userId: [],
    status: [''],
    halfDay: [false],
    halfDayTime: ['']
  });


  onHalfDayChange(event: MatCheckboxChange) {
    if (!event.checked) {
      this.leaveRequestForm.get('halfDayTime')?.reset();
    }
  }
  onSubmit() {
    let data = {
      leaveType: this.leaveRequestForm.get('leaveType')?.value,
      reason: this.leaveRequestForm.get('reason')?.value,
      fromDate: this.datePipe.transform(this.leaveRequestForm.get('fromDate')?.value, 'yyyy-MM-dd'),
      toDate: this.datePipe.transform(this.leaveRequestForm.get('toDate')?.value, 'yyyy-MM-dd'),
      compensation: this.leaveRequestForm.get('compensation')?.value,
      //therapistId: this.therapistId,
      status: 'Requested',
    };
    this.leaveService.addLeave(data).subscribe((res) => {
      // this.clearControls()
    });
  }
  cancelForm(){

  }
  onUpdate(){

  }
}

