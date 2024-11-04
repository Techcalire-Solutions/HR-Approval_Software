import { Component, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatIconModule } from '@angular/material/icon';
import { SafePipe } from "../../../common/safe.pipe";
@Component({
  selector: 'app-add-announcements',
  standalone: true,
  imports: [MatFormFieldModule, MatCheckboxModule, MatSelectModule, MatOptionModule, MatInputModule, MatButtonModule, MatCardModule,
    ReactiveFormsModule, PagesComponent, MatIconModule, SafePipe],
  templateUrl: './add-announcements.component.html',
  styleUrl: './add-announcements.component.scss'
})
export class AddAnnouncementsComponent implements OnDestroy {
  ngOnDestroy(): void {
    this.ancmntSub?.unsubscribe();
  }
  @Input() message: string = '';
  @Input() type: string = 'info';
  @Input() dismissible: boolean = true;

  @Output() dismissedEvent = new EventEmitter<void>();

  fb = inject(FormBuilder);
  announcementService = inject(AnnouncementsService);
  dialogRef = inject(MatDialogRef<AddAnnouncementsComponent>);
  snackBar = inject(MatSnackBar); 

  form = this.fb.group({
    message: ['', Validators.required],
    type: ['info', Validators.required],
    dismissible: [true],
    fileUrl: [''], 
  }); 

  dismissed: boolean = false;

  dismiss() {
    this.dismissed = true;
    this.dismissedEvent.emit();  // Notify parent
  }

  file: File | null = null;
  fileType: string;
  uploadSub!: Subscription;
  imageUrl: string = ''
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png'];
  onFileSelected(event: any) {
    const input = event.target as HTMLInputElement;
    let file: any = input.files?.[0];
    this.fileType = file.type.split('/')[1];
    if (!this.allowedFileTypes.includes(this.fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, or PNG file.');
      return;
    }
    if (file) {
    const formData = new FormData();
    formData.append('file', file);

    this.uploadSub = this.announcementService.uploadAnnouncementDoc(formData).subscribe({
        next: (invoice) => {
          this.form.get('fileUrl')?.setValue(invoice.fileUrl);
          this.imageUrl = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ invoice.fileUrl}`;
        }
      });
    }
  }
  
  ancmntSub!: Subscription;
  isVisible: boolean = false;
  addAnnouncement(){
    this.ancmntSub = this.announcementService.addAnnouncement(this.form.getRawValue()).subscribe((res) => {
      this.announcementService.triggerSubmit(res);
      this.dialogRef.close();
      this.snackBar.open(`Announcement added successfully...`, 'Close', { duration: 3000 });
    })
  }

  onDeleteImage(){
    // if(this.id[i]){
    //   this.userSevice.deleteUserDoc(this.id[i], this.imageUrl[i]).subscribe(data=>{
    //     this.imageUrl[i] = ''
    //       this.doc().at(i).get('docUrl')?.setValue('');
    //     this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
    //   });
    // }else{
      this.announcementService.deleteAnouncemntUploadByurl(this.imageUrl).subscribe(data=>{
        this.imageUrl = ''
        this.form.get('fileUrl')?.setValue('')
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
      });
    // }
  }

  close(){
    this.dialogRef.close();
  }
}
