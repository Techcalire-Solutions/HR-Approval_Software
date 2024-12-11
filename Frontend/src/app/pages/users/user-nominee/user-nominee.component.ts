/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-nominee',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule, MatButtonModule,
    MatOptionModule, MatSelectModule
  ],
  templateUrl: './user-nominee.component.html',
  styleUrl: './user-nominee.component.scss'
})
export class UserNomineeComponent {
  relations = ['Father', 'Mother', 'Sister', 'Brother', 'Spouse', 'Friend', 'Other'];
  ngOnDestroy(): void {
    this.pUSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }

  @Input() nomineeData: any;

  private fb = inject(FormBuilder);
  private userService = inject(UsersService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  form = this.fb.group({
    userId: [''],
    nomineeName: [''],
    nomineeContactNumber: [''],
    nomineeRelation: [''],
    aadhaarNumber: ['']
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      // if(data.updateStatus){
        this.getPositionDetailsByUser(data.id)
      // }
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

  @Output() dataSubmitted = new EventEmitter<any>();
  private submitSub!: Subscription;
  isNext: boolean = false;
  onSubmit(){
    this.isNext = true
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.nomineeData.id;
    if(this.editStatus){
      this.submitSub = this.userService.updateUserNominee(this.id, submit).subscribe(() => {
        this.snackBar.open("Nominee Details updated succesfully...","" ,{duration:3000})
        // this.dataSubmitted.emit( {isFormSubmitted: true} );
      })}
    else{
      this.submitSub = this.userService.addUserNomineeDetails(submit).subscribe((res) => {        
        this.editStatus = true;
        this.id = res.id;
        this.snackBar.open("Nominee Details added succesfully...","" ,{duration:3000})
      })}
  }

  @Output() nextTab = new EventEmitter<void>();
  triggerNextTab() {
    this.nextTab.emit();
  }

  @Output() previousTab = new EventEmitter<void>();
  triggerPreviousTab() {
    this.previousTab.emit();
  }
}
