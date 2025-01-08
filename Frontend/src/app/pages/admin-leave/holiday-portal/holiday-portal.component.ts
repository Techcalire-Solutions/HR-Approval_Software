import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { DatePipe } from '@angular/common';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { LeaveService } from '@services/leave.service';

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
  selector: 'app-holiday-portal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './holiday-portal.component.html',
  styleUrls: ['./holiday-portal.component.scss'],
   providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
})
export class HolidayPortalComponent implements OnInit {
  selectedFile: File | null = null;
  leaveRequestForm: FormGroup;
  router = inject(Router);
  fb = inject(FormBuilder);
leaveService = inject(LeaveService)
  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.leaveRequestForm = this.fb.group({
      name: ['', Validators.required],
      date:[],
      comments:[''],
      type:[]
    });
  }

  // Handles file input change
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      this.selectedFile = file;
    } else {
      this.snackBar.open('Please select a valid Excel file.', 'Close', { duration: 3000 });
    }
  }

  // Uploads the file to the server
  uploadFile() {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      this.http.post(`${environment.apiUrl}/holidays/upload`, formData).subscribe(
        () => {
          this.snackBar.open('Holidays uploaded successfully!', 'Close', { duration: 3000 });
          this.router.navigateByUrl('/login');
          this.resetPage();
        },
        () => {
          this.snackBar.open('Failed to upload holidays. Please try again.', 'Close', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('No file selected.', 'Close', { duration: 3000 });
    }
  }

  resetPage() {
    this.selectedFile = null;
    this.leaveRequestForm.reset(); // Reset the form as well
  }
  onSubmit(){

    let data = this.leaveRequestForm.getRawValue()
    this.leaveService.addHolidays(data).subscribe((res)=>{
      console.log(res);

    })

  }
}
