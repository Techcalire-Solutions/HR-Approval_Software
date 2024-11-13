import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LeaveService } from '@services/leave.service';
import { Subscription } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserLeave } from '../../../common/interfaces/leaves/userLeave';
import { LeaveType } from '../../../common/interfaces/leaves/leaveType';

@Component({
  selector: 'app-user-leave',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatCardModule, MatInputModule],
  templateUrl: './user-leave.component.html',
  styleUrl: './user-leave.component.scss'
})
export class UserLeaveComponent implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<UserLeaveComponent>)
  data = inject(MAT_DIALOG_DATA);

  mainForm = this.fb.group({
    forms: this.fb.array([])
  });

  new(initialValue?: LeaveType, userLeave?: UserLeave): FormGroup {
    return this.fb.group({
      userId: [this.data.id],
      leaveTypeId: [initialValue ? initialValue.id : ''],
      typeName: [initialValue ? initialValue.leaveTypeName : ''],
      noOfDays: [userLeave ? Number(userLeave.noOfDays) : 0],
      takenLeaves: [userLeave ? userLeave.takenLeaves : 0],
      leaveBalance: [userLeave ? userLeave.leaveBalance : 0]
    });
  }

  addNew(data?: LeaveType, userLeave?: UserLeave) {
    this.newData().push(this.new(data, userLeave));
  }

  removeData(index: number) {
    const formArray = this.newData();
    formArray.removeAt(index);
  }

  newData(): FormArray {
    return this.mainForm.get('forms') as FormArray;
  }

  ngOnInit(): void {
    this.getLeaveTypes();
    this.mainForm.get('forms')?.valueChanges.subscribe((values) => {
      this.subscribeToValueChanges();
    });
  }

  subscribeToValueChanges() {
    const entries = this.newData(); // Get the FormArray
    entries.controls.forEach((control, index) => {
      control.valueChanges.subscribe((value) => {
        this.calculateBalance(index, value);
      });
    });
  }

  updated: UserLeave[] = [];
  private updatedIndices: Set<number> = new Set();
  calculateBalance(i: number, data: UserLeave){
    let alloted: number = data.noOfDays;
    let taken: number = data.takenLeaves;
    const leaveBalance = alloted - taken;

    this.newData().at(i).patchValue({ leaveBalance }, { emitEvent: false });
  if (i < this.updated.length) {
    this.updated[i] = { ...data, leaveBalance };
  } else {
    this.updated.push({ ...data, leaveBalance });
  }

  }

  onCancelClick(){
    this.dialogRef.close();
  }

  submit: Subscription;
  onSubmit(){
    this.submit = this.leaveService.updateUserLeave(this.updated).subscribe(res=>{
      this.dialogRef.close();
      this.snackBar.open(`Leave updated successfully for ${this.data.name}...`, 'Close', { duration: 3000 });
    })
  }

  leaveService = inject(LeaveService)
  leaveTypeSub!: Subscription;
  leaveTypes: LeaveType[] = [];
  getLeaveTypes(){
    this.leaveTypeSub = this.leaveService.getLeaveType().subscribe(res => {
      this.leaveTypes = res;
      for(let i = 0; i < this.leaveTypes.length; i++){

        this.getUserLeave(this.leaveTypes[i].id, this.leaveTypes[i])
      }
    })
  }

  ulSub!: Subscription;
  snackBar = inject(MatSnackBar);
  getUserLeave(id: number, leaveTypes: LeaveType){
    this.ulSub = this.leaveService.getUserLeave(this.data.id, id).subscribe(res => {
      this.addNew(leaveTypes, res)
    })
  }


  ngOnDestroy(): void {
    this.ulSub?.unsubscribe();
    this.leaveTypeSub?.unsubscribe();
    this.submit?.unsubscribe();
  }
}
