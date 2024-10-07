import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AnnouncementsService } from '@services/announcements.service';
import { Subscription } from 'rxjs';
import { PagesComponent } from '../../pages.component';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-announcements',
  standalone: true,
  imports: [MatFormFieldModule, MatCheckboxModule, MatSelectModule, MatOptionModule, MatInputModule, MatButtonModule, MatCardModule,
    ReactiveFormsModule, PagesComponent],
  templateUrl: './add-announcements.component.html',
  styleUrl: './add-announcements.component.scss'
})
export class AddAnnouncementsComponent {
  @Input() message: string = '';
  @Input() type: string = 'info';
  @Input() dismissible: boolean = true;

  @Output() dismissedEvent = new EventEmitter<void>();

  fb = inject(FormBuilder);
  announcementService = inject(AnnouncementsService);
  dialogRef = inject(MatDialogRef<AddAnnouncementsComponent>);
  snackBar = inject(MatSnackBar); 

  form = this.fb.group({
    message: [''],
    type: ['info'],
    dismissible: [true] 
  }); 

  dismissed: boolean = false;

  dismiss() {
    this.dismissed = true;
    this.dismissedEvent.emit();  // Notify parent
  }

  file: File | null = null;
  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.file = file ? file : null;
  }
  
  ancmntSub!: Subscription;
  isVisible: boolean = false;
  addAnnouncement(message: string, type: string, dismissible: boolean){
    console.log(this.form.getRawValue());
    this.ancmntSub = this.announcementService.addAnnouncement(this.form.getRawValue()).subscribe((res) => {
      this.announcementService.triggerSubmit(res);
      this.dialogRef.close();
      this.snackBar.open(`Announcement added successfully...`, 'Close', { duration: 3000 });
    })
  }

}
