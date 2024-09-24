import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
    MatInputModule, MatSlideToggleModule, MatButtonModule],
  templateUrl: './personal-details.component.html',
  styleUrl: './personal-details.component.scss'
})
export class PersonalDetailsComponent implements OnInit, OnDestroy {
  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);

  @Input() data: any;
  @Output() dataSubmitted = new EventEmitter<any>();

  ngOnInit(data?: any): void {
    if(data){
      if(data.updateStatus){
        this.getPersonalDetailsByUser(data.id)
      }

      // this.getEntryId(entryId)
      // if(data.trans){
      //   this.finalForm.get('trans')?.setValue(data.trans)
      //   this.openTrans();
      // }else if(!data.trans && data.com){
      //   this.finalForm.get('com')?.setValue(data.com)
      //   this.openComm();
      // }else if(!data.trans && !data.com && data.unload){
      //   this.finalForm.get('unload')?.setValue(this.data.unload)
      //   this.openUnload()
      // }
    }
  }

  pUSub!: Subscription;
  getPersonalDetailsByUser(id: number){
    console.log(id);
    this.pUSub = this.userService.getUserPersonalDetailsByUser(id).subscribe(data=>{
      this.form.patchValue({

      })
    })
  }

  form = this.fb.group({
    empNo: [],
    userId: [],
    dateOfJoining: [''],
    probationPeriod: [''],
    confirmationDate: [''],
    maritalStatus: ['', Validators.required],
    dateOfBirth: [''],
    gender: [''],
    isTemporary: [],
    parentName: [''],
    spouseName: [''],
    referredBy: [''],
    reportingManger: ['']
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

}
