import { Component, Inject, inject } from '@angular/core';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { LeaveService } from '@services/leave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { LeaveType } from '../../../../common/interfaces/leaves/leaveType';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-add-leave-type-dialogue',
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
    MatProgressSpinnerModule,
    MatDialogModule],
    providers: [DatePipe],
  templateUrl: './add-leave-type-dialogue.component.html',
  styleUrl: './add-leave-type-dialogue.component.scss'
})
export class AddLeaveTypeDialogueComponent {
  formBuilder=inject(FormBuilder);
  datePipe=inject(DatePipe)
  leaveService=inject(LeaveService)
  _snackBar=inject(MatSnackBar)
  dialog=inject(MatDialog)
  leaveType = inject(MAT_DIALOG_DATA);

  leaveTypeForm = this.formBuilder.group({
    leaveTypeName: ['', Validators.required]
  });


  ngOnInit(){
    if (this.leaveType) {
      this.patchLeaveType(this.leaveType);
    }
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.getLeaveTypes()
  }

  leaveTypes: LeaveType[] = [];
  roleSub!: Subscription;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  getLeaveTypes(){
    this.roleSub = this.leaveService.getLeaveType(this.searchText, this.currentPage, this.pageSize).subscribe((res: any)=>{
      this.leaveTypes = res.items;
      this.totalItems = res.count;
    })
  }
  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getLeaveTypes()
  }

  // leaveType: LeaveType;
  patchLeaveType(leaveType: any){
    this.leaveTypeForm.patchValue({
      leaveTypeName: this.leaveType.leaveTypeName
    })
  }
  close(): void {

  }
  onSubmit(){
    if(this.leaveType){
      this.leaveService.updateLeaveType(this.leaveType.id, this.leaveTypeForm.getRawValue()).subscribe(data => {
        // this.dialogRef.close()
        this._snackBar.open("Leave Type updated succesfully...","" ,{duration:3000})
        this.getLeaveTypes();
      });
    }else{
      this.leaveService.addLeaveType(this.leaveTypeForm.getRawValue()).subscribe((res)=>{
        // this.dialogRef.close();
        this._snackBar.open("Leave Type added succesfully...","" ,{duration:3000})
        this.getLeaveTypes();
      })
    }
  }
  SubmitForm(){

  }
}

