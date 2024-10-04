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

  ngAfterViewInit() {
    if (!this.pagesComponent) {
      console.error('pagesComponent is not initialized');
    }
  }
  
  @ViewChild(PagesComponent) pagesComponent!: PagesComponent;
  ancmntSub!: Subscription;
  isVisible: boolean = false;
  addAnnouncement(message: string, type: string, dismissible: boolean){
    console.log(this.form.getRawValue());
    this.ancmntSub = this.announcementService.addAnnouncement(this.form.getRawValue()).subscribe((res) => {
      console.log(res);
      if (this.pagesComponent) {
        this.pagesComponent.getAnnouncement(res);
      } else {
        console.error('pagesComponent is undefined');
      }

    })
  }

}
