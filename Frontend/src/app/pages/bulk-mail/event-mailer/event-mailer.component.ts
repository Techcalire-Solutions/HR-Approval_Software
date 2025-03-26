import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../common/interfaces/users/user';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { UserPosition } from '../../../common/interfaces/users/user-position';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BulkMailService } from '@services/bulkmail.service';

@Component({
  selector: 'app-event-mailer',
  templateUrl: './event-mailer.component.html',
  styleUrls: ['./event-mailer.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
})
export class EventMailerComponent implements OnInit, OnDestroy {
  eventForm: FormGroup;
  selectedFile: File | null = null;
  stepIndex = 0;
  filteredEmployees: any[] = [];
  employees: any[] = [];
  employeeSub: Subscription;

  userService = inject(UsersService);
  bulkmailService = inject(BulkMailService)
  fb = inject(FormBuilder);
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  imagePreview: string | null = null;
  isLoading = false;
  allSelected = false;
  indeterminate = false;
  searchText = '';

  ngOnInit() {
    this.getEmployees();
    this.eventForm = this.fb.group({
      selectedUsers: [[]],
      emailSubject: [''],
      emailMessage: [''],
    });
  }

  ngOnDestroy(): void {
    if (this.employeeSub) {
      this.employeeSub.unsubscribe(); // ✅ Properly unsubscribe to prevent memory leaks
    }
  }

  getEmployees() {
    this.employeeSub = this.userService.getConfirmedEmployees().subscribe((data) => {
      this.employees = data
        .filter(employee => employee.userPosition?.officialMailId)
        .map(employee => ({
          id: employee.id,
          name: employee.name,
          officialEmail: employee.userPosition.officialMailId
        }));
      this.filteredEmployees = [...this.employees];
    });
  }

  nextStep() {
    this.stepIndex++;
  }

  previousStep() {
    this.stepIndex--;
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];

      // Show Image Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  toggleSelectAll() {
    this.allSelected = !this.allSelected;
    this.indeterminate = false;

    this.eventForm.patchValue({
      selectedUsers: this.allSelected ? this.employees.map(emp => emp.id) : []
    });
  }

  optionClick() {
    const selectedUsers = this.eventForm.value.selectedUsers;
    if (selectedUsers.length === this.employees.length) {
      this.allSelected = true;
      this.indeterminate = false;
    } else if (selectedUsers.length > 0) {
      this.allSelected = false;
      this.indeterminate = true;
    } else {
      this.allSelected = false;
      this.indeterminate = false;
    }
  }

  isSelected(id: number): boolean {
    return this.eventForm.value.selectedUsers.includes(id);
  }

  getRecipientNames(): string {
    return this.eventForm.value.selectedUsers
      .map((id: number) => {
        const emp = this.employees.find(emp => emp.id === id);
        return emp ? emp.name : 'Unknown';
      })
      .join(', ');
  }

  filterUsers() {
    this.filteredEmployees = this.employees.filter(emp =>
      emp.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }


  sendEmail() {
    this.isLoading = true;
    const formData = new FormData();

    // Convert selectedUsers to JSON before appending
    formData.append('selectedUsers', JSON.stringify(this.eventForm.value.selectedUsers));
    formData.append('emailSubject', this.eventForm.value.emailSubject);
    formData.append('emailMessage', this.eventForm.value.emailMessage);

    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }
    this.bulkmailService.sendEventMail(formData).subscribe(
      response => {
        this.isLoading = false;
        this.snackBar.open('📧 Email sent successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/login/mail']);
      },
      error => {
        this.isLoading = false;
        console.error('❌ Error sending email:', error);
      }
    );
  }
}
