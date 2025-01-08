import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-user-nominee',
  standalone: true,
  imports: [ MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
      MatOptionModule, MatSelectModule ],
  templateUrl: './edit-user-nominee.component.html',
  styleUrl: './edit-user-nominee.component.scss'
})
export class EditUserNomineeComponent implements OnInit, OnDestroy {
  dialogRef = inject(MatDialogRef<EditUserNomineeComponent>, { optional: true })
  nomineeData = inject(MAT_DIALOG_DATA, { optional: true });
  ngOnInit(): void {
    if(this.nomineeData){
      this.getPositionDetailsByUser(this.nomineeData.id)
    }
  }

  private pUSub!: Subscription;
  id: number;
  getPositionDetailsByUser(id: number){
    this.pUSub = this.userService.getUserNomineeDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          nomineeName : data.nomineeName,
          nomineeContactNumber : data.nomineeContactNumber,
          nomineeRelation : data.nomineeRelation,
          aadhaarNumber : data.aadhaarNumber
        })
      }
    })
  }

  private fb = inject(FormBuilder);
  form = this.fb.group({
    userId: [''],
    nomineeName: [''],
    nomineeContactNumber: [''],
    nomineeRelation: [''],
    aadhaarNumber: ['']
  });

  relations = ['Father', 'Mother', 'Sister', 'Brother', 'Spouse', 'Friend', 'Other'];

  private submitSub!: Subscription;
  isNext: boolean = false;
  editStatus: boolean = false;
  private userService = inject(UsersService);
  private snackBar = inject(MatSnackBar);
  onSubmit(){
    this.isNext = true
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.nomineeData.id;
    if(this.editStatus){
      this.submitSub = this.userService.updateUserNominee(this.id, submit).subscribe(() => {
        this.dialogRef?.close();
        this.snackBar.open("Nominee Details updated succesfully...","" ,{duration:3000})
      })}
    else{
      this.submitSub = this.userService.addUserNomineeDetails(submit).subscribe((res) => { 
        this.dialogRef?.close();       
        this.editStatus = true;
        this.id = res.id;
        this.snackBar.open("Nominee Details added succesfully...","" ,{duration:3000})
      })}
  }

  ngOnDestroy(): void {
    this.pUSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }
}
