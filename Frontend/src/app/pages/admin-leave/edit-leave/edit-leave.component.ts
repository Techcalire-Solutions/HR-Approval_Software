import { CommonModule, formatDate } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LeaveService } from '@services/leave.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { LeaveInfoDialogComponent } from '../../employee-leave/leave-info-dialog/leave-info-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LeaveCountCardsComponent } from '../../employee-leave/leave-count-cards/leave-count-cards.component';
import { NativeDateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core';
import { DateAdapter } from 'angular-calendar';
function sessionSelectionValidator(group: FormGroup) {
  const session1 = group.get('session1')?.value;
  const session2 = group.get('session2')?.value;

  return (session1 || session2) ? null : { sessionRequired: true };
}
@Component({
  selector: 'app-edit-leave',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatTableModule,
    MatSnackBarModule,
    LeaveCountCardsComponent,
    MatNativeDateModule,
  ],
  templateUrl: './edit-leave.component.html',
  styleUrl: './edit-leave.component.scss',
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
})
export class EditLeaveComponent {
  isDateDisabled: boolean = true;

  isEditMode: boolean = false;

  leaveRequestForm: FormGroup;
  leaveTypes: any[] = [];
  isLoading = false;


snackBar = inject(MatSnackBar);
router = inject(Router)
route = inject(ActivatedRoute)
fb = inject(FormBuilder)
leaveService = inject(LeaveService)
sanitizer = inject(DomSanitizer);
userService = inject(UsersService);
dialog = inject(MatDialog);
isPatchMode = false;


leave : any
userId : number
  ngOnInit() {
    this.isPatchMode = true;
    console.log("isPatchMode:", this.isPatchMode); // Check if it's true/false
    this.isPatchMode = this.checkIfPatchMode();


      const leaveId = this.route.snapshot.params['id'];
      this.isPatchMode = true;
      console.log(leaveId);


      if (leaveId) {
          this.isEditMode = true;
          console.log(this.isEditMode);

          this.leaveService.getLeaveById(+leaveId).subscribe((response: any) => {
              this.leave = response;
              console.log(this.leave);


              this.leaveRequestForm.patchValue({
                  leaveTypeId: this.leave.leaveTypeId,
                  startDate: this.leave.startDate,
                  endDate: this.leave.endDate,
                  notes: this.leave.notes
              });



              const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
              leaveDatesArray.clear();
              this.leave.leaveDates.forEach((leaveDate: any) => {
                  leaveDatesArray.push(this.fb.group({
                      date: [leaveDate.date],
                      session1: [leaveDate.session1],
                      session2: [leaveDate.session2]
                  }));
              });
          });
      }

      this.leaveRequestForm = this.fb.group({
          leaveTypeId: ['', Validators.required],
          startDate: ['', Validators.required],
          endDate: ['', Validators.required],
          notes: ['', Validators.required],
          leaveDates: this.fb.array([]),
      });

      if (this.isEditMode || this.isPatchMode) {
        this.leaveRequestForm.get('startDate')?.disable();
        this.leaveRequestForm.get('endDate')?.disable();
      }
  }

  checkIfPatchMode(): boolean {
    // Logic to check if it's patch mode (e.g., based on route or condition)
    return true;  // Example, replace with actual logic
  }


  displayedColumns: string[] = ['leaveType', 'startDate', 'endDate', 'reason', 'session'];
  get leaveDates(): FormArray {
    return this.leaveRequestForm.get('leaveDates') as FormArray;
  }



  validateDateRange(): boolean {
    const startDate = this.leaveRequestForm.get('startDate')!.value;
    const endDate = this.leaveRequestForm.get('endDate')!.value;
    return new Date(startDate) <= new Date(endDate);
  }

  updateLeaveDates(start: Date, end: Date) {
    const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
    leaveDatesArray.clear();

    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const leaveDateGroup = this.fb.group({
        date: [formatDate(dt, 'yyyy-MM-dd', 'en-US')],
        session1: [false],
        session2: [false]
      }, { validators: sessionSelectionValidator });

      leaveDatesArray.push(leaveDateGroup);
    }
  }


  onSessionChange(index: number, session: string) {
    const leaveDateGroup = this.leaveDates.at(index) as FormGroup;
    const currentValue = leaveDateGroup.get(session)?.value;
    leaveDateGroup.get(session)?.setValue(!currentValue);
  }




  getLeaveDetails(id: number) {
    this.leaveService.getLeaveById(id).subscribe((leave) => {
      this.leave = leave;
    });
  }

  onSubmit() {
    if (this.isPatchMode) {
      const leaveId = this.route.snapshot.params['id'];
      this.isLoading = true;

      const leaveRequest = {
          ...this.leaveRequestForm.value,
          leaveDates: this.leaveRequestForm.get('leaveDates')!.value
      };

      console.log( this.leaveRequestForm.get('leaveDates')!.value);


      this.leaveService.untakenLeaveUpdate(leaveId, leaveRequest).subscribe(
          (response: any) => {
            this.snackBar.open('Leave request updated successfully...', 'Close', { duration: 3000 });
            window.history.back();
              this.isLoading = false;
          },
          (error) => {
              this.isLoading = false;
              this.snackBar.open('An error occurred while updating the leave request.', 'Close', { duration: 3000 });
          }
      );
    }

}









  getLeaveType() {
    this.leaveService.getLeaveType().subscribe(
      (leaveTypes: any) => {
        this.leaveTypes = leaveTypes;

      },
      (error) => {
        console.error('Error fetching leave types:', error);
      }
    );
  }

  getLeaveSub : Subscription
  getLeaves(){
       this.getLeaveSub= this.leaveService.getLeaves().subscribe((res)=>{
         })
  }

  uploadProgress: number | null = null;
  file!: File;
  imageUrl!: string;
  fileName: string = '';
  isFileSelected: boolean = false;

  uploadFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];

    if (selectedFile) {
      this.file = selectedFile;
      this.fileName = this.file.name;
      this.isFileSelected = true;
      this.leaveService.uploadImage(this.file).subscribe({
        next: (res) => {
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.leaveRequestForm.get('url')?.setValue(res.fileUrl);
        },
        error: () => console.error('Upload failed'),
      });
    } else {
      this.fileName = '';
      this.isFileSelected = false;
    }
  }




isSickLeave(): boolean {
  const leaveTypeId = this.leaveRequestForm.get('leaveTypeId')?.value;
  const sickLeaveTypeId = this.leaveTypes.find(type => type.leaveTypeName === 'Sick Leave')?.id;
  return leaveTypeId === sickLeaveTypeId;
}



 isProbationEmployee: boolean = false;
 checkProbationStatus() {

  this.userService.getProbationEmployees().subscribe((employees) => {
    this.isProbationEmployee = employees.some((emp: any) => emp.id === this.userId);
    if (this.isProbationEmployee) {
      this.leaveTypes = this.leaveTypes.filter(type => type.leaveTypeName === 'LOP');
    }
  });
}

ngOnDestroy(){
  if(this.getLeaveSub){
    this.getLeaveSub.unsubscribe();
  }



}

}
