import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeaveService } from '@services/leave.service';
import { UserLeave } from '../../../common/interfaces/leaves/userLeave';
import { Subscription } from 'rxjs';
import { UsersService } from '@services/users.service';
import { User } from '../../../common/interfaces/users/user';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { SafePipe } from "../../../common/pipes/safe.pipe";
import { MatSnackBar } from '@angular/material/snack-bar';
import { Leave } from '../../../common/interfaces/leaves/leave';
import { ActivatedRoute, Router } from '@angular/router';
import { NewLeaveService } from '@services/new-leave.service';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RoleService } from '@services/role.service';
import { Role } from '../../../common/interfaces/users/role';
import { UserEmailComponent } from '../../users/user-email/user-email.component';
import { MatDialog } from '@angular/material/dialog';
import { LeaveInfoDialogComponent } from './leave-info-dialog/leave-info-dialog.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

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
  selector: 'app-apply-leave',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, ReactiveFormsModule, MatFormFieldModule, MatOptionModule, MatDatepickerModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatSelectModule, SafePipe, DatePipe, MatInputModule, CommonModule, MatButtonModule, 
    MatAutocompleteModule],
  templateUrl: './apply-leave.component.html',
  styleUrl: './apply-leave.component.scss',
    providers: [ provideMomentDateAdapter(MY_FORMATS), DatePipe ]
})
export class ApplyLeaveComponent implements OnInit, OnDestroy{
  private readonly leaveService = inject(NewLeaveService);

  private readonly fb = inject(FormBuilder);
  leaveRequestForm = this.fb.group({
    userId: <any>[, Validators.required],
    leaveTypeId: <any>['', Validators.required],
    startDate: <any>['', Validators.required],
    endDate: <any>['', Validators.required],
    notes: ['', Validators.required],
    fileUrl:[''],
    leaveDates: this.fb.array([]),
    status: [''],
    fromEmail: [''],
    appPassword: [''],
    userName: ['']
  });

  filteredOptions: User[] = [];
  patch(selectedSuggestion: User) {
    this.leaveRequestForm.patchValue({ userId: selectedSuggestion.id, userName: selectedSuggestion.name });
    this.checkProbationStatus(selectedSuggestion.id);
  }

  filterValue: string;
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredOptions = this.users.filter(option =>
      option.name.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.empNo.toString().replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
  }


  isEditMode: boolean = false;
  private readonly route = inject(ActivatedRoute);
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    const roleId = user.role
    this.getRoleById(roleId, user.id)
    this.getLeaveType();
    const leaveId = this.route.snapshot.params['id'];
    if (leaveId) {
      this.isEditMode = true;
      this.getLeaveDetails(+leaveId)
    }
  }

  private readonly roleService = inject(RoleService);
  private roleSub!: Subscription;
  roleName: string;
  employeeStat: boolean = false;
  getRoleById(id: number, userId: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe((res: Role) => {
      let roleName = res.abbreviation
      if(roleName !== 'HR Admin' && roleName !== 'Super Admin'){
        this.employeeStat = true;
        this.checkProbationStatus(userId);
        this.leaveRequestForm.get('userId')?.setValue(userId);
        this.leaveRequestForm.get('status')?.setValue('Requested');
      }else{
        this.getUsers()
        this.leaveRequestForm.get('status')?.setValue('AdminApproved');
      }
    })
  }


  private leaveSub!: Subscription;
  private leave: Leave;
  getLeaveDetails(id: number) {
    this.leaveSub = this.leaveService.getLeaveById(id).subscribe((leave) => {
      this.checkProbationStatus(leave.userId)
      if(leave.fileUrl){
        this.imageUrl = leave.fileUrl;
      }
      this.minEndDate = new Date(leave.startDate);
      this.minEndDate.setDate(this.minEndDate.getDate());
      this.leave = leave;
      this.leaveRequestForm.patchValue({
        userName: this.leave.user.name,
        userId: this.leave.userId,
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

  ulSub!: Subscription;
  userLeaves: UserLeave[] = [];
  getUserLeaves(id: number){
    this.ulSub = this.leaveService.getUserLeaveByUser(id).subscribe((response: any) => {
      this.userLeaves = response;
    });
  }

  private readonly userService = inject(UsersService);
  private userSub!: Subscription;
  public users : User[] = [];
  getUsers(){
    this.userSub = this.userService.getUser().subscribe(res=>{
      this.users = res;
      this.filteredOptions = this.users
    })
  }

  private employeeSub!: Subscription;
  checkProbationStatus(id: number) {
     this.getLeaveType()
     this.getUserLeaves(id)
     this.employeeSub = this.userService.getProbationEmployees().subscribe((employees) => {
       const isProbationEmployee = employees.some((emp: any) => emp.id === id);
       if (isProbationEmployee) {
         const id = this.leaveTypes.find(type => type.leaveTypeName === 'LOP').id
         this.leaveTypes = this.leaveTypes.filter(type => type.leaveTypeName === 'LOP');
         this.leaveRequestForm.get('leaveTypeId')?.setValue(id)
       }
     });
  }

  private leaveTypeSub!: Subscription;
  leaveTypes: any[] = [];
  getLeaveType() {
    this.leaveTypeSub = this.leaveService.getLeaveType().subscribe( (leaveTypes: any) => {
        this.leaveTypes = leaveTypes;
      },(error) => {
        console.error('Error fetching leave types:', error);
      }
    );
  }

  minEndDate: Date | null = null;
  onDateChange() {
    const startDate: any = this.leaveRequestForm.get('startDate')!.value;
    const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
    leaveDatesArray.clear();
    this.leaveRequestForm.get('endDate')?.reset();
    if (startDate) {
      this.minEndDate = new Date(startDate);
      this.minEndDate.setDate(this.minEndDate.getDate());
    }
  }

  onEndDateChange() {
    const startDate: any = this.leaveRequestForm.get('startDate')!.value;
    const endDate: any = this.leaveRequestForm.get('endDate')!.value;
  
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      this.updateLeaveDates(new Date(startDate), new Date(endDate));
    } else {
      // Clear the leaveDatesArray if the dates are invalid
      const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
      leaveDatesArray.clear();
    }
  }


  endDateFilter = (date: Date | null): boolean => {
    if (!date || !this.minEndDate) {
      return false;
    }
    return date >= this.minEndDate; 
  };

  isSickLeaveAndMoreThanThreeDays(): boolean {
    const leaveTypeId = this.leaveRequestForm.get('leaveTypeId')?.value;
    const startDate: any = this.leaveRequestForm.get('startDate')?.value;
    const endDate: any = this.leaveRequestForm.get('endDate')?.value;

    const sickLeaveTypeId = this.leaveTypes.find(type => type.leaveTypeName === 'Sick Leave')?.id;

    if (leaveTypeId === sickLeaveTypeId && startDate && endDate) {
      const duration = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1; // Calculate the duration in days
      return duration > 3;
    }
    return false;
  }

  updateLeaveDates(start: Date, end: Date) {
    const leaveDatesArray = this.leaveRequestForm.get('leaveDates') as FormArray;
    leaveDatesArray.clear();
  
    // Reset time component to 00:00:00 for both start and end dates
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0); // Reset time to 00:00:00
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0); // Reset time to 00:00:00
  
    for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
      const leaveDateGroup = this.fb.group({
        date: [formatDate(dt, 'yyyy-MM-dd', 'en-US')],
        session1: [false],
        session2: [false]
      }, { validators: sessionSelectionValidator });
  
      leaveDatesArray.push(leaveDateGroup);
    }
  }

  emergencyPrefix = 'Emergency: ';
  prefixEmergency(): void {
    const notesControl = this.leaveRequestForm.get('notes');
    if (notesControl && !notesControl.value?.startsWith(this.emergencyPrefix)) {
      notesControl.setValue(this.emergencyPrefix + notesControl.value);
    }
  }

  isLoading: boolean = false;
  uploadProgress: number | null = null;
  file!: File;
  imageUrl: string = '';
  fileName: string = ''; // Holds the name of the file
  isFileSelected: boolean = false;
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png'];
  uploadFile(event: Event) {
    this.isLoading = true;
    const input = event.target as HTMLInputElement;
    const selectedFile = input.files?.[0];
    const fileType: any = selectedFile?.type.split('/')[1];
    if (!this.allowedFileTypes.includes(fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, or PNG file.');
      return;
    }

    if (selectedFile) { // Check if a file was selected
      this.file = selectedFile; // Assign the file
      this.fileName = this.file.name; // Store the file name
      this.isFileSelected = true; // Set the selected state to true
      this.leaveService.uploadImage(this.file).subscribe({
        next: (res) => {
          this.isLoading = false;
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${res.fileUrl}`;
          this.leaveRequestForm.get('fileUrl')?.setValue(this.imageUrl);
          this.leaveRequestForm.get('fileUrl')?.markAsDirty();
        },
        error: () => console.error('Upload failed'),
      });
    } else {
      this.fileName = ''; // Reset the file name if no file is selected
      this.isFileSelected = false; // Reset the selected state
    }
  }

  private readonly snackBar = inject(MatSnackBar);
  onDeleteImage(){
    this.isLoading = true;
    this.leaveService.deleteUploadByurl(this.imageUrl).subscribe(()=>{
      this.isLoading = false;
      this.imageUrl = ''
      this.leaveRequestForm.get('fileUrl')?.setValue('')
      this.leaveRequestForm.get('fileUrl')?.markAsDirty();
      this.snackBar.open("File is deleted successfully...","" ,{duration:3000})
    });
  }

  get leaveDates(): FormArray {
    return this.leaveRequestForm.get('leaveDates') as FormArray;
  }
  onSessionChange(index: number, session: string) {
    const leaveDateGroup = this.leaveDates.at(index) as FormGroup;

    // Check if the form control exists
    const sessionControl = leaveDateGroup.get(session);
    if (sessionControl) {
      // Toggle the value
      const currentValue = sessionControl.value;
      sessionControl.setValue(!currentValue);

      // Mark the control as dirty
      sessionControl.markAsDirty();

      // Update the validity of the control and its group
      sessionControl.updateValueAndValidity();
      leaveDateGroup.updateValueAndValidity();
    }

    // Optionally mark the whole form as dirty
    this.leaveRequestForm.markAsDirty();
  }


  private submit: Subscription;
  private readonly router = inject(Router);
  emailSub!: Subscription;
  private readonly dialog = inject(MatDialog);
  private dialogSub!: Subscription;
  private readonly datePipe = inject(DatePipe)
  onSubmit(){
    const leaveDates = this.leaveRequestForm.get('leaveDates')!.value as { date: string | number | Date }[];

    const leaveRequest = {
      ...this.leaveRequestForm.value,
      leaveDates: leaveDates.map(item => ({
        ...item,
        date: this.datePipe.transform(item.date, 'yyyy-MM-dd')
      }))
    };
    if (this.leaveRequestForm.get('startDate')?.value) {
      const sd = this.leaveRequestForm.get('startDate')?.value as string | number | Date;
      leaveRequest.startDate = this.datePipe.transform(sd, 'yyyy-MM-dd');
    }
    if (this.leaveRequestForm.get('endDate')?.value) {
      const ed = this.leaveRequestForm.get('endDate')?.value as string | number | Date;
      leaveRequest.endDate = this.datePipe.transform(ed, 'yyyy-MM-dd');
    }
    if(!this.employeeStat){
      this.isLoading = true;
      if (this.isEditMode) {
        this.submit = this.leaveService.updatemergencyLeave(leaveRequest, this.leave.id).subscribe(() => {
          this.isLoading = false;
          this.router.navigateByUrl('/login/leave')
          this.snackBar.open("Emergency leave updated successfully...","" ,{duration:3000})
        });
      } else {
        this.submit = this.leaveService.addEmergencyLeave(leaveRequest).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.router.navigateByUrl('/login/leave');
            this.snackBar.open("Emergency leave added successfully...", "", { duration: 3000 });
          },
          error: (err) => { 
            this.isLoading = false;
            this.router.navigateByUrl('/login/leave');
            this.snackBar.open("Failed to add emergency leave. Please try again.", "", { duration: 3000 });
          }
        });
      }
    }else{
        const id: any = this.leaveRequestForm.get('userId')?.value
        this.emailSub = this.leaveService.getUserEmail(id).subscribe(data => {
          if(!data){
            const dialogRef = this.dialog.open(UserEmailComponent, {
              width: '600px',
              data: {
                userId: id, type: 'Official'
              }
            });
            this.dialogSub = dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.submitLeaveRequest(leaveRequest);
              } else {
                this.isLoading = false; 
                this.router.navigateByUrl('/login/leave');
              }
            });
          } else {
            // Proceed with leave request submission if email exists
            this.submitLeaveRequest(leaveRequest);
          }
        });

      // }
    }
  }

  submitLeaveRequest(leaveRequest: any): void {
    this.isLoading = true;
    const request$ = this.isEditMode
      ? this.leaveService.updateLeave(this.leave.id, leaveRequest)
      : this.leaveService.addLeave(leaveRequest);
    request$.subscribe(
      (response: any) => {
        this.openDialog(response.message, response.leaveDatesApplied, response.lopDates);
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.router.navigate(['/login/leave']);
        this.snackBar.open('An error occurred while submitting the leave request.', 'Close', { duration: 3000 });
      }
    );
  }

  openDialog(message: string, leaveDatesApplied: any[], lopDates: any[]) {
    const dialogRef = this.dialog.open(LeaveInfoDialogComponent, {
      data: {
        message: message,
        leaveDatesApplied: leaveDatesApplied,
        lopDates: lopDates
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result.action === 'proceed') this.handleDialogResult(result);
      else this.snackBar.open('Leave request cancelled!', 'Close', { duration: 3000 });
    });
  }

  handleDialogResult(result: any) {
    // if (result?.action === 'proceed') {
      this.snackBar.open('Leave request submitted successfully!', 'Close', { duration: 3000 });
      this.router.navigate(['/login/leave']);
    // }
  }


  ngOnDestroy(): void {
    this.ulSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.employeeSub?.unsubscribe();
    this.leaveTypeSub?.unsubscribe();
  }

}

function sessionSelectionValidator(group: FormGroup) {
  const session1 = group.get('session1')?.value;
  const session2 = group.get('session2')?.value;

  return (session1 || session2) ? null : { sessionRequired: true };
}
