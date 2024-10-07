import { DatePipe, CommonModule } from '@angular/common';
import { Component, Inject, inject, OnDestroy, OnInit } from '@angular/core';
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
import { Announcement } from '../../common/interfaces/announcement';
import { Role } from '../../common/interfaces/role';
import { RoleService } from '@services/role.service';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  roleService = inject(RoleService);
  snackBar = inject(MatSnackBar);
  ngOnInit(): void {
    this.getAnnouncement();

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }

  roleSub!: Subscription;
  roleName: string;
  getRoleById(id: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe((res: Role) => {
      this.roleName = res.abbreviation
    })
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
  announcements: Announcement[] = [];
  getAnnouncement(){
    this.announcementService.getAnnouncement().subscribe(res => {
      this.announcements = res;
    })
  }

  getAnnouncementClass(type: string): string {
    switch (type) {
      case 'info':
        return 'announcement-info';
      case 'warning':
        return 'announcement-warning';
      case 'success':
        return 'announcement-success';
      case 'error':
        return 'announcement-error';
      default:
        return '';
    }
  }

  getSymbol(type: string): string {
    switch (type) {
      case 'info':
        return 'ℹ️'; // Information symbol
      case 'warning':
        return '⚠️'; // Warning symbol
      case 'success':
        return '✅'; // Success symbol
        case 'error':
          return '❌';
      default:
        return '';
    }
  }

  delete: Subscription;
  deleteAnnouncement( id: number){
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.announcementService.deleteAnnouncement(id).subscribe(res => {
          this.snackBar.open("Announcement deleted successfully...","" ,{duration:3000})
          this.getAnnouncement()
        });
      }
    });
  }
}
