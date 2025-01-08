/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AddAnnouncementsComponent } from './add-announcements/add-announcements.component';
import { AnnouncementsService } from '@services/announcements.service';
import { Subscription } from 'rxjs';
import { Announcement } from '../../common/interfaces/announcement';
import { RoleService } from '@services/role.service';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Role } from '../../common/interfaces/users/role';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [FormsModule, FlexLayoutModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatMenuModule, MatSlideToggleModule, MatCardModule, NgxPaginationModule,
    CommonModule, MatPaginatorModule],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit, OnDestroy{
  apiUrl ='https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  private dialog = inject(MatDialog)
  private announcementService = inject(AnnouncementsService);
  private roleService = inject(RoleService);
  private snackBar = inject(MatSnackBar);
  ngOnInit(): void {
    this.getAnnouncement();

    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    const roleId = user.role
    this.getRoleById(roleId)
  }

  private roleSub!: Subscription;
  roleName: string;
  getRoleById(id: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe((res: Role) => {
      this.roleName = res.abbreviation
    })
  }

  openDialog(data: any){
    const dialogRef = this.dialog.open(AddAnnouncementsComponent, {
      // data: user
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getAnnouncement()
    });
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.announceSub?.unsubscribe();
  }

  announceSub!: Subscription;
  announcements: Announcement[] = [];
  getAnnouncement(){
    this.announceSub = this.announcementService.getAnnouncement(this.searchText).subscribe(res => {
      this.announcements = res;
      this.isVisible = false;
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
  isVisible: boolean = false;
  deleteAnnouncement( id: number){
    // eslint-disable-next-line prefer-const
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.isVisible = true;
        this.delete = this.announcementService.deleteAnnouncement(id).subscribe(() => {
          this.isVisible = false;
          this.snackBar.open("Announcement deleted successfully...","" ,{duration:3000})
          this.getAnnouncement()
        });
      }
    });
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getAnnouncement()
  }

  enlargedItemId: number | null = null;

  toggleImageSize(itemId: number) {
    this.enlargedItemId = this.enlargedItemId === itemId ? null : itemId;
  }
}

