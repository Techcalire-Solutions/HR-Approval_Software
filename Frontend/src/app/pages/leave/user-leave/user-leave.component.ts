import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LeaveService } from '@services/leave.service';
import { Subscription } from 'rxjs';
import { LeaveType } from '../../../common/interfaces/leaveType';
import { UserLeave } from '../../../common/interfaces/userLeave';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-user-leave',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatCardModule, MatInputModule],
  templateUrl: './user-leave.component.html',
  styleUrl: './user-leave.component.scss'
})
export class UserLeaveComponent implements OnInit {
  fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<UserLeaveComponent>) 
  data = inject(MAT_DIALOG_DATA);

  mainForm = this.fb.group({
    forms: this.fb.array([])
  });

  new(initialValue?: LeaveType): FormGroup {
    return this.fb.group({
      userId: [ this.data.id],
      leaveTypeId : [ initialValue?initialValue.id : ''],
      typeName : [initialValue?initialValue.leaveTypeName : ''],
      noOfDays : [],
      takenLeaves : [],
      leaveBalance : []
    });
  }

  index!: number;
  clickedForms: boolean[] = [];
  addNew(data?:any){
    this.newData().push(this.new(data));
    this.clickedForms.push(false);
  }

  removeData(index: number) {
    const formArray = this.newData() as FormArray;
    formArray.removeAt(index);
  }


  newData(): FormArray {
    return this.mainForm.get("forms") as FormArray;
  }

  ngOnInit(): void {
    this.getLeaveTypes();
  }
  
  onCancelClick(){
    this.dialogRef.close();
  }

  onSubmit(){

  }

  leaveService = inject(LeaveService)
  leaveTypeSub!: Subscription;
  leaveTypes: LeaveType[] = [];
  getLeaveTypes(){
    this.leaveTypeSub = this.leaveService.getLeaveType().subscribe(res => {
      this.leaveTypes = res;
      console.log(this.leaveTypes);
      for(let i = 0; i <= this.leaveTypes.length; i++){
        this.addNew(this.leaveTypes[i])
        this.getUserLeave(this.leaveTypes[i].id)
      }
    })
  }

  ulSub!: Subscription;
  getUserLeave(id: number){
    this.ulSub = this.leaveService.getUserLeave(this.data.id, id).subscribe(res => {
      // for(let i = 0; i < res.length; i++){
      //   let leaveType = this.leaveTypes.find(lt => lt.id === res[i].leaveTypeId)
      //   this.newData().controls[i].patchValue({
      //     leaveTypeId: leaveType.id,
      //     typeName: leaveType.leaveTypeName,
      //     noOfDays: res[i].noOfDays,
      //     takenLeaves: res[i].takenLeaves,
      //     leaveBalance: res[i].leaveBalance
      //   })
      // }
    })
  }
}
