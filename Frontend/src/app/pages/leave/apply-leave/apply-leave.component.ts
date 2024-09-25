
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { LeaveType } from '../../../common/interfaces/leaveType';
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
  ngOnInit(){
    this.getLeaveType()
    this.leaveRequestForm = this.formBuilder.group({
      leaveTypeId: ['', Validators.required],
      notes: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      userId: 1,
      status: [''],
      halfDay: [false],
      halfDayTime: ['']
    });
  }
  leaveRequestForm: FormGroup;

  public leaveTypes: LeaveType[] | null;
  public getLeaveType(): void {

    this.leaveService.getLeaveType().subscribe((leaveTypes: any) =>{
    this.leaveTypes = leaveTypes
    });
  }


  onHalfDayChange(event: MatCheckboxChange) {
    if (!event.checked) {
      this.leaveRequestForm.get('halfDayTime')?.reset();
    }
  }
  onSubmit() {

      this.leaveService.addLeave(this.leaveRequestForm.getRawValue()).subscribe(
        (response: any) => {
          console.log(response);
        },
        (error: any) => {
          alert(error);
        }
      );
    }





  cancelForm(){

  }
  onUpdate(){

  }
}

