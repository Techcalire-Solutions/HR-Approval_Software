import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { MatStepperModule } from '@angular/material/stepper';
import { BulkMailService } from '@services/bulkmail.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



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
    MatProgressSpinnerModule
  ],
  templateUrl: './birthday-message-draft.component.html',
  styleUrls: ['./birthday-message-draft.component.scss']
})
export class BirthdayMessageDraftComponent implements OnInit {
  employeeName: string = '';
  messageContent: string = '';
  selectedFile: File | null = null;
  router = inject(Router)

  constructor(
    private route: ActivatedRoute,
    private bulkmailService: BulkMailService
  ) { }

  ngOnInit(): void {
    this.employeeName = this.route.snapshot.paramMap.get('name') || '';
    this.messageContent = `
Dear ${this.employeeName},



On this special day, all of us at Onboard Aero Consultant would like to extend our warmest wishes to you! 🎂🎈 

May this year bring you happiness, success, and good health. Your hard work and dedication are truly appreciated, and we are grateful to have you as part of our team.

Enjoy your day to the fullest, and may the year ahead be filled with joy and great achievements! 🎊🥳

Happy Birthday! 🎉`
  }


  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('File selected:', file);
    }
  }



  isLoading: boolean = false;
  sendMessage(): void {
    if (!this.employeeName || !this.messageContent) {
      alert('Please provide a valid name and message.');
      return;
    }

    this.isLoading = true; 

    this.bulkmailService.sendMailWishes({
      to: this.employeeName,
      subject: `Happy Birthday, ${this.employeeName}!`,
      message: this.messageContent,
      attachment: this.selectedFile || undefined,
   
    }).subscribe(
      (response) => {
        this.isLoading = false;
        alert(response.message); 
        this.router.navigate(['/login/mail']);
      },
      (error) => {
        this.isLoading = false;
        alert('Error sending message.');
        console.error(error);
      }
    );
  }


}
