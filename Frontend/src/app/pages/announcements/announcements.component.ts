import { DatePipe, CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { SafePipe } from '../add-approval/view-invoices/safe.pipe';
import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddAnnouncementsComponent } from './add-announcements/add-announcements.component';
import { AnnouncementsService } from '@services/announcements.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [ FormsModule, FlexLayoutModule, MatButtonModule, MatButtonToggleModule,  MatIconModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatMenuModule,  MatSlideToggleModule, MatCardModule, NgxPaginationModule, DatePipe, UserDialogComponent,
    CommonModule, SafePipe, MatPaginatorModule
  ],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit, OnDestroy{
  dialog = inject(MatDialog)
  announcementService = inject(AnnouncementsService);
  ngOnInit(): void {
    this.getAnnouncement();
  }
  openDialog(data: any){
    let dialogRef = this.dialog.open(AddAnnouncementsComponent, {
      // data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      // this.getRoles()
    });
  }

  ngOnDestroy(): void {
    
  }

  announceSub!: Subscription;
  getAnnouncement(){
    this.announcementService.getAnnouncement().subscribe(res => {
      console.log(res);  
    })
  }
}
