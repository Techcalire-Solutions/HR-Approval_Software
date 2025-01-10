/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import {MatTableModule} from '@angular/material/table';

import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService } from '@services/role.service';
import { SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { LeaveService } from '@services/leave.service';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { Router } from '@angular/router';
import { UplaodDialogComponent } from './uplaod-dialog/uplaod-dialog.component';

@Component({
  selector: 'app-employee-leave',
  standalone: true,
  imports: [
    MatTableModule,
    MatInputModule,
    FormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatCardModule,
    NgxPaginationModule,
    PipesModule,
    DatePipe,
    CommonModule,
    MatPaginatorModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    UsersService
  ],
  templateUrl: './employee-leave.component.html',
  styleUrl: './employee-leave.component.scss'
})
export class EmployeeLeaveComponent {
  public page: number;
  snackBar = inject(MatSnackBar);
  roleService = inject(RoleService);
  settingsService = inject(SettingsService);
  dialog = inject(MatDialog);
  usersService = inject(UsersService);
  router = inject(Router)
  leaveService = inject(LeaveService)

  userId: number
  ngOnInit() {
    this.getLeaveByUser()
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)
    this.userId = user.id;
    this.getLeaveByUser();
  }



  ngOnDestroy(): void {
    this.leaveSub.unsubscribe();
    // if (this.delete) {
    //   this.delete.unsubscribe();
    // }

  }

  totalSickLeave: number = 0;
  isButtonVisible: boolean = false;
  selectedLeaveDays: number = 0;
  leaves: any[] = []
  leaveSub: Subscription
  
  private getLeaveByUser(): void {
    if (!this.userId) return;
    this.leaveSub = this.leaveService.getLeavesByUser(this.userId, this.searchText, this.currentPage, this.pageSize).subscribe(
      (res: any) => {
        this.leaves = res.items;
        this.totalItems = res.count;

        this.totalSickLeave = this.leaves
          .filter(leave => leave.leaveType?.leaveTypeName === 'Sick Leave')
          .reduce((total, leave) => total + (leave.noOfDays || 0), 0);




        this.isButtonVisible = this.totalSickLeave >= 3;
        console.log('Is Button Visible:', this.isButtonVisible);


      },
      (error) => {
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      }
    );
  }


  public searchText!: string;
  search(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getLeaveByUser()
  }

  openApplyLeave() {
    this.router.navigate(['/login/employee-leave/add'])
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 5;
  currentPage = 1;
  totalItems = 0;

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getLeaveByUser()
  }

  enlargedItemId: number | null = null;

  toggleImageSize(itemId: number) {
    this.enlargedItemId = this.enlargedItemId === itemId ? null : itemId;
  }


  editLeave(item: any) {
    this.router.navigate(['/login/employee-leave/add'], { queryParams: { id: item.id } });
  }


  isSickLeave() {
  }

  uploadFile(item: any) {
    console.log(item.id)
    console.log(item)
    this.router.navigate(['/login/employee-leave/add'], { queryParams: { id: item } });

  }

  delete!: Subscription;
  // deleteLeaveStableFunction(id: number) {
  //   let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
  //   dialogRef.afterClosed().subscribe(res => {
  //     if (res) {
  //       this.delete = this.leaveService.deleteLeave(id).subscribe(res => {
  //         this.snackBar.open('Leave request deleted successfully!', 'Close', { duration: 3000 });
  //         this.getLeaveByUser()
  //       });
  //     }
  //   });
  //   this.leaves = this.leaves.filter(item => item.id !== id);
  // }


  hasValidSessions(leaveDates: any[]): boolean {
    return leaveDates.some(date => date.session1 || date.session2);
  }

  getPaginatedLeaves(): void {
    this.leaveSub = this.leaveService.getLeavesPaginated(this.searchText, this.currentPage, this.pageSize).subscribe((res: any) => {
      console.log(res);
      this.totalItems = res.count;
      this.leaves = res.items;
      console.log(this.leaves)
    });
  }
  deleteLeave(leaveId: number): void {
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      data: { leaveId: leaveId }
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Find the leave item to check for associated file
        const leaveItem = this.leaves.find((leave) => leave.id === leaveId);
  
        this.leaveService.deleteUntakenLeave(leaveId).subscribe({
          next: (response) => {
            if (leaveItem?.fileUrl) {
              // Call API to delete associated file
              this.leaveService.deleteUploadByurl(leaveItem.fileUrl).subscribe({
                next: () => {
                  this.snackBar.open('Leave deleted and file removed successfully!', 'Close', { duration: 3000 });
                },
                error: () => {
                  this.snackBar.open('Leave deleted, but file removal failed!', 'Close', { duration: 3000 });
                }
              });
            } else {
              this.snackBar.open('Leave deleted successfully, no associated file found.', 'Close', { duration: 3000 });
            }
  
            // Refresh the leave list
            this.getPaginatedLeaves();
          },
          error: (error) => {
            console.error('Error deleting leave:', error);
            this.snackBar.open('Error deleting leave request!', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
  

  uploadMedicalCertificate(leaveId: any, note: string): void {
  }


  openDialog(action: string, leaveId: string): void {
    const dialogRef = this.dialog.open(UplaodDialogComponent, {
      data: { leaveId }, // Pass leaveId as part of the dialog data
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.fileUrl) {

        console.log('File URL returned:', result.fileUrl);


        this.updateLeaveFileUrl(leaveId, result.fileUrl);
      } else {
        console.log('No file URL returned');
      }
    });
  }

  updateLeaveFileUrl(leaveId: string, fileUrl: string): void {

    this.leaveService.updateLeaveFileUrl(leaveId, fileUrl).subscribe({
      next: (res) => {
        console.log('File URL updated successfully');
      },
      error: (err) => {
        console.error('Failed to update file URL', err);
      }
    });
  }





}
