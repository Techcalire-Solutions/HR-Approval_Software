import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { UserPersonal } from '../../common/interfaces/users/user-personal';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { EventMailerComponent } from './event-mailer/event-mailer.component';
import { HttpClient, HttpContext } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BulkMailService } from '@services/bulkmail.service';

@Component({
  selector: 'app-bulk-mail',
  imports: [DatePipe,
    MatCardModule,
    MatTab,
    MatTabsModule,
    EventMailerComponent,
    MatTableModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule
  ],
  templateUrl: './bulk-mail.component.html',
  styleUrl: './bulk-mail.component.scss'
})
export class BulkMailComponent {
  @ViewChild('recipientsDialog') recipientsDialogTemplate: any;

  recipientList: string[] = [];
  constructor(private router: Router) { }
  dialog = inject(MatDialog)
  http = inject(HttpClient)
  bulkmailService = inject(BulkMailService)



  navigateTo(option: string) {
    if (option === 'birthday') {
      this.router.navigate(['/birthday']);
    } else if (option === 'events') {
      this.router.navigate(['/events']);
    }
  }

  userService = inject(UsersService);

  ngOnInit(): void {
    this.getBirthdays();
    this.getEmailLogs()
  }

  openRecipientsDialog(recipients: string[]): void {
    this.recipientList = recipients; // Directly assign the array
    this.dialog.open(this.recipientsDialogTemplate, {
      width: '400px'
    });
  }


  birthSub!: Subscription;
  birthdaysThisMonth: UserPersonal[] = [];
  getBirthdays() {
    this.birthSub = this.userService.getBirthdays().subscribe(res => {
      this.birthdaysThisMonth = res;
    })
  }



  ngOnDestroy(): void {
    this.birthSub?.unsubscribe();
  }


  openEvent() {
    this.router.navigate(['/login/mail/event'])

  }


  emailLogs: any[] = [];
  sentEmails: string[] = []; 
  displayedColumns: string[] = ['id', 'subject', 'message', 'recipients', 'timestamp'];

  getEmailLogs() {

    this.bulkmailService.EventLogs().subscribe({
      next: (response) => {
        this.emailLogs = response || [];
        this.sentEmails = this.emailLogs.map(log => log.recipients); 
        console.log('📜 Email Logs:', this.emailLogs);
      },
      error: (error) => {
        console.error('❌ Error fetching email logs:', error);
        this.emailLogs = [];
      }
    });
  }

  isEmailSent(employeeName: string): boolean {
    return this.sentEmails.includes(employeeName);
  }

  openDraft(name: string) {
    if (!this.isEmailSent(name)) {
      this.router.navigate(['login/mail/birthday-draft', name]);
    }
  }


}
