/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../../common/interfaces/users/user';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../../personal-details/personal-details.component';

@Component({
  selector: 'app-edit-user-personal',
  standalone: true,
  imports: [ MatFormFieldModule, MatDatepickerModule, MatRadioModule, ReactiveFormsModule, MatOptionModule, MatSelectModule,
      MatInputModule, MatSlideToggleModule, MatButtonModule, MatCardModule, MatIconModule, MatAutocompleteModule ],
  templateUrl: './edit-user-personal.component.html',
  styleUrl: './edit-user-personal.component.scss',
    providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserPersonalComponent implements OnInit, OnDestroy{
  dialogRef = inject(MatDialogRef<EditUserPersonalComponent>, { optional: true })
  dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  ngOnInit(): void {
    this.getReportingManager(this.dialogData.id);
    if(this.dialogData){
      this.getPersonalDetailsByUser(this.dialogData.id)
    }
  }

  pUSub!: Subscription;
  id: number;
  editStatus: boolean = false;
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
          experience: data.experience
        })
      }
    })
  }

  private fb = inject(FormBuilder);
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

  relations = ['Father', 'Mother', 'Sister', 'Brother', 'Spouse', 'Friend', 'Other'];

  rmSub!: Subscription;
  rm: User[] = [];
  private userService = inject(UsersService)
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

  copyAddress(): void {
    const permanentAddress = this.form.get('permanentAddress')?.value;
    this.form.patchValue({ temporaryAddress: permanentAddress });
  }

  submitSub!: Subscription;
  private datePipe = inject(DatePipe);
  private snackBar = inject(MatSnackBar);
  onSubmit(){
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.dialogData.id;
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
        this.dialogRef?.close();
        this.snackBar.open("Personal Details updated succesfully...","" ,{duration:3000})
      })
    }
    else{
      this.submitSub = this.userService.addUserPersonalDetails(submit).subscribe((res) => {
        this.editStatus = true;
        this.id = res.id;
        this.dialogRef?.close();
        this.snackBar.open("Personal Details added succesfully...","" ,{duration:3000})
      })
    }
  }

  ngOnDestroy(): void {
    this.rmSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }
}
