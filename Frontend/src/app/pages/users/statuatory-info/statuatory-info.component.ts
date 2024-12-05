/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatButtonModule } from '@angular/material/button';
import { UsersService } from './../../../services/users.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { StatutoryInfo } from '../../../common/interfaces/users/statutory-info';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import {provideMomentDateAdapter} from '@angular/material-moment-adapter';
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Change to desired format
  },
  display: {
    dateInput: 'DD/MM/YYYY', // Display format for the input field
    monthYearLabel: 'MMM YYYY', // Format for month/year in the header
    dateA11yLabel: 'DD/MM/YYYY', // Accessibility format for dates
    monthYearA11yLabel: 'MMMM YYYY', // Accessibility format for month/year
  },
};

@Component({
  selector: 'app-statuatory-info',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule, 
    MatDatepickerModule, MatIconModule ],
  templateUrl: './statuatory-info.component.html',
  styleUrl: './statuatory-info.component.scss',
  providers: [provideMomentDateAdapter(MY_FORMATS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class StatuatoryInfoComponent implements OnDestroy {
  ngOnDestroy(): void {
    this.pUSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }

  @Input() statuatoryData: StatutoryInfo;

  private fb = inject(FormBuilder);
  private userService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    userId : <any>[],
    adharNo : [''],
    panNumber : [''],
    esiNumber : [''],
    uanNumber : [''],
    insuranceNumber: [''],
    pfNumber : [''],
    passportNumber : [''],
    passportExpiry: <any>[],
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      // if(data.updateStatus){
        this.getStatutoryDetailsByUser(data.id)
      // }
    }
  }

  pUSub!: Subscription;
  private id: number;
  getStatutoryDetailsByUser(id: number){
    this.pUSub = this.userService.getUserStatutoryuDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          adharNo : data.adharNo,
          panNumber : data.panNumber,
          esiNumber : data.esiNumber,
          uanNumber : data.uanNumber,
          insuranceNumber : data.insuranceNumber,
          pfNumber : data.pfNumber,
          passportNumber : data.passportNumber,
          passportExpiry: data.passportExpiry,
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
    submit.userId = submit.userId ? submit.userId : this.statuatoryData.id;
    if(this.editStatus){
      this.submitSub = this.userService.updateUserStatutory(this.id, submit).subscribe(() => {
        this.snackBar.open("Statutory Details updated succesfully...","" ,{duration:3000})
        // this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }
    else{
      this.submitSub = this.userService.addStautoryInfo(submit).subscribe(() => {
        this.snackBar.open("Statutory Details added succesfully...","" ,{duration:3000})
        // this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }
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
