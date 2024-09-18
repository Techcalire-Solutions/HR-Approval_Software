import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SafePipe } from '../../add-approval/view-invoices/safe.pipe';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LeaveService } from '@services/leave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeaveType } from '../../../common/interfaces/leaveType';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-leave-types',
  standalone: true,
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
    MatProgressSpinnerModule, SafePipe,
    MatDialogModule],
    providers: [DatePipe],
  templateUrl: './leave-types.component.html',
  styleUrl: './leave-types.component.scss'
})
export class LeaveTypesComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public leaveType: LeaveType,
    private formBuilder: FormBuilder, private datePipe: DatePipe,
    private leaveService: LeaveService,
    public dialogRef: MatDialogRef<LeaveTypesComponent>,
    private _snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);

    // this.therapistId = user.id;

    // this.userRole = user.role;
  }
  leaveTypeForm = this.formBuilder.group({
    leaveTypeName: ['', Validators.required]
  });

  ngOnInit() {
    if (this.leaveType) {
      this.patchRole(this.leaveType);
    }
  }

  patchRole(role: any){
    this.leaveTypeForm.patchValue({
      leaveTypeName: this.leaveType.leaveTypeName

    })
  }


  close(): void {
    this.dialogRef.close();
  }
  onSubmit(){
    if(this.leaveType){
      this.leaveService.updateLeaveType(this.leaveType.id, this.leaveTypeForm.getRawValue()).subscribe(data => {
        this.dialogRef.close()
        this._snackBar.open("Role updated succesfully...","" ,{duration:3000})
      });
    }else{
      this.leaveService.addLeaveType(this.leaveTypeForm.getRawValue()).subscribe((res)=>{
        this.dialogRef.close();
        this._snackBar.open("Role added succesfully...","" ,{duration:3000})
      })
    }
  }
  SubmitForm(){

  }
}
