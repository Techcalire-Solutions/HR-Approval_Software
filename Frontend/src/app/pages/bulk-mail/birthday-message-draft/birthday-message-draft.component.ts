/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { MatStepperModule } from '@angular/material/stepper';
import { BulkMailService } from '@services/bulkmail.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';



@Component({
  selector: 'app-birthday-message-draft',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './birthday-message-draft.component.html',
  styleUrls: ['./birthday-message-draft.component.scss']
})
export class BirthdayMessageDraftComponent implements OnInit {
  employeeName: string = '';
  employeeEmail: string = '';
  messageContent: string = '';
  selectedFile: File | null = null;
  isLoading: boolean = false;
  showPreview: boolean = false;
  
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UsersService);
  private employeeSub: Subscription;

  constructor( private route: ActivatedRoute, private bulkmailService: BulkMailService ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('name');
    this.selectedTime = `08:00`;
    if (id) {
      this.getEmployeeById(+id);
    } else {
      this.snackBar.open('No employee specified', 'Close', { duration: 3000 });
    }
  }

  ngOnDestroy(): void {
    if (this.employeeSub) {
      this.employeeSub.unsubscribe();
    }
  }

  updateStatus: boolean = false;
  templateId: number;
  getEmployeeById(id: number): void {
    this.isLoading = true;
    this.employeeSub = this.userService.getUserById(id).subscribe({
      next: (res) => {
        const date = new Date(res.userpersonal[0].dateOfBirth);
        const currentYear = new Date().getFullYear();
        this.selectedDate = new Date(currentYear, date.getMonth(), date.getDate());
        this.employeeName = res.name;
        this.employeeEmail = res.email;
        this.bulkmailService.getTemplateByUserId(res.id).subscribe(res => {
          if(res){
            this.templateId = res.id;
            this.updateStatus = true;
            this.messageContent = res.message
          }else{
            this.messageContent = this.generateDefaultMessage();
          }
        })
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load employee details', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.router.navigate(['/employees']);
      }
    });
  }

  generateDefaultMessage(): string {
    return `Dear ${this.employeeName},

      On this special day, all of us at Onboard Aero Consultant would like to extend our warmest wishes to you! 🎂🎈 

      May this year bring you happiness, success, and good health. Your hard work and dedication are truly appreciated, and we are grateful to have you as part of our team.

      Enjoy your day to the fullest, and may the year ahead be filled with joy and great achievements! 🎊🥳

      Happy Birthday! 🎉`;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('File size should be less than 5MB', 'Close', { duration: 3000 });
        return;
      }
      this.selectedFile = file;
    }
  }

  removeFile(): void {
    this.selectedFile = null;
  }

  previewMessage(): void {
    this.showPreview = true;
  }

  formatMessageForPreview(): string {
    return this.messageContent.replace(/\n/g, '<br>');
  }

  sendMessage(): void {
    // const scheduledTime = this.getScheduledTimestamp();
    if (!this.messageContent.trim()) {
      this.snackBar.open('Please write a birthday message', 'Close', { duration: 3000 });
      return;
    }

    if (!this.selectedDate || !this.selectedTime) {
      this.snackBar.open('Please select delivery date and time', 'Close', { duration: 3000 });
      return;
    }
    const scheduledDateTime = this.getScheduledTimestamp();
    this.isLoading = true;
    
    const formData = new FormData();
    formData.append('userId', this.route.snapshot.paramMap.get('name') || '');
    formData.append('subject', `Happy Birthday, ${this.employeeName}!`);
    formData.append('message', this.messageContent);
    formData.append('timestamp', scheduledDateTime); 
    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile);
    }

    if(this.updateStatus){
      this.bulkmailService.updateBirthdayTemplate(formData, this.templateId).subscribe({
        next: (response) => {
          this.snackBar.open('Birthday message sent successfully!', 'Close', { duration: 3000 });
          this.isLoading = false;
          this.router.navigate(['/mail']);
        },
        error: (error) => {
          this.snackBar.open('Error sending message. Please try again.', 'Close', { duration: 3000 });
          this.isLoading = false;
          console.error('Error sending message:', error);
        }
      });
    }else{
      this.bulkmailService.birthdayTemplate(formData).subscribe({
        next: (response) => {
          this.snackBar.open('Birthday message sent successfully!', 'Close', { duration: 3000 });
          this.isLoading = false;
          this.router.navigate(['/mail']);
        },
        error: (error) => {
          this.snackBar.open('Error sending message. Please try again.', 'Close', { duration: 3000 });
          this.isLoading = false;
          console.error('Error sending message:', error);
        }
      });
    }
  }

  selectedDate: any;
  selectedTime: string;
  sendImmediately: boolean = true;
  minDate: Date = new Date();
  onSendImmediatelyChange() {
    if (this.sendImmediately) {
      this.selectedDate = null;
      this.selectedTime = '08:00';
    }
  }

  private getScheduledTimestamp(): string {
    const date = new Date(this.selectedDate);
    const [hours, minutes] = this.selectedTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString(); // or format as needed for backend
  }

  // getScheduledDateTime(): string {
  //   if (!this.selectedDate || !this.selectedTime) return '';
    
  //   const dateStr = formatDate(this.selectedDate, 'MMM d, y', 'en-US');
  //   return `${dateStr} at ${this.selectedTime}`;
  // }

  // getScheduledTimestamp(): Date | null {
  //   if (this.sendImmediately || !this.selectedDate || !this.selectedTime) {
  //     return null;
  //   }

  //   const [hours, minutes] = this.selectedTime.split(':').map(Number);
  //   const scheduledDate = new Date(this.selectedDate);
  //   scheduledDate.setHours(hours, minutes, 0, 0);
    
  //   return scheduledDate;
  // }
}