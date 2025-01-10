import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { LeaveService } from '@services/leave.service';
import { UsersService } from '@services/users.service';
import { DomSanitizer } from '@angular/platform-browser';
import { formatDate } from 'date-fns';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NativeDateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS, MatNativeDateModule } from '@angular/material/core';
import { DateAdapter } from 'angular-calendar';
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
import { MatTabsModule } from '@angular/material/tabs';
import { SafePipe } from '../../../common/safe.pipe';
import { LeaveCountCardsComponent } from '../../employee-leave/leave-count-cards/leave-count-cards.component';

@Component({
  selector: 'app-view-leave-details',
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
    SafePipe,
    CommonModule,
    MatTabsModule
  ],
  templateUrl: './view-leave-details.component.html',
  styleUrl: './view-leave-details.component.scss',
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
})
export class ViewLeaveDetailsComponent {
  isLoading = false;
  leaveRequestForm: FormGroup;
  leaveTypes: any[] = [];
  leave: any;
  userId: number;
  signedUrl: any[] = [];
  public userImage = 'img/users/default-user.jpg';
  apiUrl = 'https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  snackBar = inject(MatSnackBar);
  router = inject(Router);
  route = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  leaveService = inject(LeaveService);
  userService = inject(UsersService);
  sanitizer = inject(DomSanitizer);

  ngOnInit() {
    const leaveId = this.route.snapshot.params['id'];
    if (leaveId) {
      this.isLoading = true;

      this.leaveService.getLeaveById(+leaveId).subscribe((response: any) => {
        this.leave = response;
        console.log('leavebyId',response);


        if (this.leave.fileUrl) {
          this.signedUrl = [{
            fileUrl: this.sanitizer.bypassSecurityTrustResourceUrl(this.leave.fileUrl),
            type: this.leave.fileUrl.split('.').pop()?.split('?')[0] || 'defaultType',
          }];
        } else {
          this.signedUrl = [];
        }

     

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

        this.isLoading = false;
      }, (error) => {
        this.snackBar.open('Error fetching leave details.', 'Close', { duration: 3000 });
        this.isLoading = false;
      });
    }


    this.leaveRequestForm = this.fb.group({
      leaveTypeId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      notes: ['', Validators.required],
      leaveDates: this.fb.array([]),
    });


    this.leaveRequestForm.get('startDate')?.disable();
    this.leaveRequestForm.get('endDate')?.disable();
  }


  getSafeUrl(fileUrl: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
  }



  get leaveDates(): FormArray {
    return this.leaveRequestForm.get('leaveDates') as FormArray;
  }


  formatDate(date: string): string {
    return formatDate(date, 'yyyy-MM-dd');
  }
}
