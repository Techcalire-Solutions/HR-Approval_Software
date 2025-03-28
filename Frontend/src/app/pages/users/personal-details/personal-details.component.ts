/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnDestroy, Output } from '@angular/core';
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
import { User } from '../../../common/interfaces/users/user';
import { MatIconModule } from '@angular/material/icon';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { DatePipe } from '@angular/common';

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
  selector: 'app-personal-details',
  standalone: true,
  imports: [ MatFormFieldModule, MatDatepickerModule, MatRadioModule, ReactiveFormsModule, MatOptionModule, MatSelectModule,
    MatInputModule, MatSlideToggleModule, MatButtonModule, MatCardModule, MatIconModule, MatAutocompleteModule],
  templateUrl: './personal-details.component.html',
  styleUrl: './personal-details.component.scss',
  providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalDetailsComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  @Input() data: any;  
  @Input() loading = false;
  @Output() loadingState = new EventEmitter<boolean>();
  @Output() dataSubmitted = new EventEmitter<any>();

  // ngOnInit(): void {
  //   this.getReportingManager()
  // }

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    this.getReportingManager(data.id)
    if(data){
      this.getPersonalDetailsByUser(data.id)
    }
  }

  pUSub!: Subscription;
  id: number;
  getPersonalDetailsByUser(id: number){
    this.pUSub = this.userService.getUserPersonalDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          userId: data.userId,
          dateOfJoining: data.dateOfJoining,
          probationPeriod: data.probationPeriod,
          maritalStatus: data.maritalStatus,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          isTemporary: data.isTemporary,
          parentName: data.parentName,
          spouseName: data.spouseName,
          referredBy: data.referredBy,
          reportingMangerId: data.reportingMangerId,
          emergencyContactNo: data.emergencyContactNo,
          emergencyContactName: data.emergencyContactName,
          emergencyContactRelation: data.emergencyContactRelation,
          bloodGroup: data.bloodGroup,
          spouseContactNo: data.spouseContactNo, 
          parentContactNo: data.parentContactNo, 
          motherName: data.motherName, 
          motherContactNo: data.motherContactNo, 
          temporaryAddress: data.temporaryAddress, 
          permanentAddress: data.permanentAddress,
          qualification: data.qualification, 
          experience: data.experience,
          reportingMangerName: data.manager.name
        })
      }
    })
  }

  form = this.fb.group({
    userId: <any>[],
    dateOfJoining: <any>[null],
    probationPeriod: [''],
    maritalStatus: [''],
    dateOfBirth: <any>[null],
    gender: [''],
    isTemporary: [true],
    parentName: [''],
    spouseName: [''],
    referredBy: [''],
    reportingMangerId: <any>[],
    emergencyContactNo: ['', Validators.compose([Validators.pattern(/^\d{10}$/)])],
    emergencyContactName: [''],
    emergencyContactRelation: [''],
    bloodGroup: [''],
    spouseContactNo: [''], 
    parentContactNo: [''], 
    motherName: [''], 
    motherContactNo: [''], 
    temporaryAddress: [''], 
    permanentAddress: [''],
    qualification: [''], 
    experience: [''],
    reportingMangerName: ['']
  });

  copyAddress(): void {
    const permanentAddress = this.form.get('permanentAddress')?.value;
    this.form.patchValue({ temporaryAddress: permanentAddress });
  }

  submitSub!: Subscription;
  isNext: boolean = false;
  private datePipe = inject(DatePipe)
  onSubmit(){
    this.loadingState.emit(true);
    this.isNext = true
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.data.id;
    if (this.form.get('dateOfBirth')?.value) {
      const dateOfBirth = this.form.get('dateOfBirth')?.value as string | number | Date;
      submit.dateOfBirth = this.datePipe.transform(dateOfBirth, 'yyyy-MM-dd');
    }
    if (this.form.get('dateOfJoining')?.value) {
      const dateOfJoining = this.form.get('dateOfJoining')?.value as string | number | Date;
      submit.dateOfJoining = this.datePipe.transform(dateOfJoining, 'yyyy-MM-dd');
    }

    if(this.editStatus){
      this.submitSub = this.userService.updateUserPersonal(this.id, submit).subscribe(() => {
        this.loadingState.emit(false);
        this.snackBar.open("Personal Details updated succesfully...","" ,{duration:3000})
      })
    }
    else{
      this.submitSub = this.userService.addUserPersonalDetails(submit).subscribe((res) => {
        this.editStatus = true;
        this.id = res.id;
        this.loadingState.emit(false);
        this.snackBar.open("Personal Details added succesfully...","" ,{duration:3000})
      })
    }
  }

  relations = ['Father', 'Mother', 'Sister', 'Brother', 'Spouse', 'Friend', 'Other'];

  ngOnDestroy(): void {
    this.submitSub?.unsubscribe();
    this.pUSub?.unsubscribe();
    this.rmSub?.unsubscribe();
  }

  formatDateOnly(date: any): string {
    if (!date) return '';  // Handle null or undefined date
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';  // Return empty string for invalid dates
    }

    // Get the local year, month, and day (avoiding UTC conversion)
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);  // Add leading zero and ensure month is 2 digits
    const day = ('0' + d.getDate()).slice(-2);  // Add leading zero and ensure day is 2 digits

    return `${year}-${month}-${day}`;  // Return formatted date as YYYY-MM-DD
  }


  @Output() nextTab = new EventEmitter<void>();
  triggerNextTab() {
    this.nextTab.emit();
  }

  @Output() previousTab = new EventEmitter<void>();
  triggerPreviousTab() {
    this.previousTab.emit();
  }


  rmSub!: Subscription;
  rm: User[] = [];
  getReportingManager(id: number){
    this.rmSub = this.userService.getUser().subscribe(res=>{
      this.rm = res.filter(user => user.id != id);
      this.filteredRm = this.rm;
    })
  }

  filterValue: string;
  filteredRm: User[] = [];
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredRm = this.rm.filter(option =>
      option.name.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.empNo.toString().replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
  }

  patch(selectedSuggestion: User) {
    this.form.patchValue({ reportingMangerId: selectedSuggestion.id, reportingMangerName: selectedSuggestion.name });
  }
}

