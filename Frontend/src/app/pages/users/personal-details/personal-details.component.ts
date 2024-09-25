import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [ MatFormFieldModule, MatDatepickerModule, MatRadioModule, ReactiveFormsModule, MatOptionModule, MatSelectModule,
    MatInputModule, MatSlideToggleModule, MatButtonModule, MatCardModule],
  templateUrl: './personal-details.component.html',
  styleUrl: './personal-details.component.scss'
})
export class PersonalDetailsComponent implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);

  @Input() data: any;
  @Output() dataSubmitted = new EventEmitter<any>();

  ngOnInit(): void { }
  
  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      console.log(data);
      
      if(data.updateStatus){
        this.editStatus = true;
        console.log(this.editStatus);
        
        this.getPersonalDetailsByUser(data.id)
      }
    }
  }

  pUSub!: Subscription;
  getPersonalDetailsByUser(id: number){
    console.log(id);
    this.pUSub = this.userService.getUserPersonalDetailsByUser(id).subscribe(data=>{
      console.log(data);
      if(data){
        this.form.patchValue({
          dateOfJoining: data.dateOfJoining,
          probationPeriod: data.probationPeriod,
          confirmationDate: data.confirmationDate,
          maritalStatus: data.maritalStatus,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          isTemporary: data.isTemporary,
          parentName: data.parentName,
          spouseName: data.spouseName,
          referredBy: data.referredBy,
          reportingManger: data.reportingManger
        })
      }
    })
  }

  form = this.fb.group({
    empNo: [],
    userId: [],
    dateOfJoining: <any>[],
    probationPeriod: [''],
    confirmationDate: <any>[],
    maritalStatus: ['', Validators.required],
    dateOfBirth: <any>[],
    gender: [''],
    isTemporary: [true],
    parentName: [''],
    spouseName: [''],
    referredBy: [''],
    reportingManger: <any>[]
  });

  submitSub!: Subscription;
  onSubmit(){
    let submit = {
      ...this.form.getRawValue()
    }
    submit.userId = this.data.id;
    submit.empNo = this.data.empNo;
    submit.dateOfJoining = this.formatDateOnly(submit.dateOfJoining);
    submit.confirmationDate = this.formatDateOnly(submit.confirmationDate);
    submit.dateOfBirth = this.formatDateOnly(submit.dateOfBirth);
    console.log(submit);
    this.submitSub = this.userService.addUserPersonalDetails(submit).subscribe(data => {
      this.snackBar.open("Personal Details added succesfully...","" ,{duration:3000})
      this.dataSubmitted.emit( {isFormSubmitted: true} );
    })
  }

  ngOnDestroy(): void {
  }

  formatDateOnly(date: any): string | null {
    if (!date || isNaN(new Date(date).getTime())) {
      return null; // Return null for invalid or empty dates
    }
    const validDate = new Date(date);
    return validDate.toISOString().split('T')[0]; // Return 'YYYY-MM-DD' format
  }

  @Output() nextTab = new EventEmitter<void>();
  triggerNextTab() {
    this.nextTab.emit();
  }

  getReportingManager(){
    
  }
}
