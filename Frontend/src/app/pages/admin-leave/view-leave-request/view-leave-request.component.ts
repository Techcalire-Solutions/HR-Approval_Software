import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { LeaveService } from '@services/leave.service';
import { RoleService } from '@services/role.service';
import { SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../../theme/pipes/pipes.module';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { SafePipe } from "../../../common/pipes/safe.pipe";
import { UplaodDialogComponent } from '../../employee-leave/uplaod-dialog/uplaod-dialog.component';
import { Leave } from '../../../common/interfaces/leaves/leave';
@Component({
  selector: 'app-view-leave-request',
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
    MatPaginatorModule,
    RouterModule,
    SafePipe
],
  templateUrl: './view-leave-request.component.html',
  styleUrl: './view-leave-request.component.scss'
})
export class ViewLeaveRequestComponent implements OnInit, OnDestroy {
  public page: number;
  snackBar = inject(MatSnackBar);
  roleService = inject(RoleService);
  settingsService = inject(SettingsService);
  dialog = inject(MatDialog);
  usersService = inject(UsersService);
  router = inject(Router)
  leaveService = inject(LeaveService)
  snackbar = inject(MatSnackBar)
  leaveSub: Subscription
  pageSize = 5;
  currentPage = 1;
  totalItems = 0;
  searchText: string = '';

  leaves: Leave[] = []

  userId: number

  ngOnInit() {
    this.getPaginatedLeaves()
  }

  getPaginatedLeaves(): void {
    this.leaveSub = this.leaveService.getLeavesPaginated(this.searchText, this.currentPage, this.pageSize).subscribe((res: any) => {
      this.totalItems = res.count;
      this.leaves = res.items;
      console.log(this.leaves)
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getPaginatedLeaves();
  }

  search(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.trim()
  }

  ngOnDestroy(): void {
    this.leaveSub.unsubscribe();
  }


  openCalendar() {
    this.router.navigate(['login/leave/leaveCalendar']);
  }

  onDeleteLeave(leaveId: number): void {
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      data: { leaveId: leaveId }
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Find the leave item to check for associated file
        const leaveItem = this.leaves.find((leave) => leave.id === leaveId);
  
        this.leaveService.deleteUntakenLeave(leaveId).subscribe({
          next: () => {
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
  
            // Refresh the leave list after successful deletion
            this.getPaginatedLeaves();
          },
        });
      }
    });
  }
  
  onEditLeave(leaveId: number): void {
    this.router.navigate([`/login/admin-leave/edit-emergency-leave/${leaveId}`]);
  }

  openDialog(action: string, leaveId: number): void {
    if (action === 'reject') {
      this.openNoteDialog(action, leaveId);
    } else if (action === 'approve') {
      this.leaveService.getLeaveBalance(leaveId).subscribe(
        (res: any) => {
          console.log(res);
  
          if (res.leaveType === 'LOP' || res.isSufficient) {
            // Open note dialog for approval
            this.openNoteDialog(action, leaveId);
          } else {
            // Show error for insufficient balance (non-LOP)
            this.snackbar.open('Insufficient leave balance. Cannot approve.', 'Close', { duration: 3000 });
          }
        },
        () => {
          this.snackbar.open('Error checking leave balance.', 'Close', { duration: 3000 });
        }
      );
    }
  }
  

  private openNoteDialog(action: string, leaveId: number): void {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      data: {
        action,
        leaveId,
        heading: action === 'approve' ? 'Approve Note' : 'Reject Note',
      },
    });

    dialogRef.afterClosed().subscribe(note => {
      if (note) {
        action === 'approve' ? this.approveLeave(leaveId, note) : this.rejectLeave(leaveId, note);
      }
    });
  }





  approveLeave(leaveId: any, note: string) {
    const approvalData = { leaveId: leaveId, adminNotes: note };
    this.leaveService.updateApproveLeaveStatus(approvalData).subscribe(
      (res) => {
        console.log(res);

        this.snackbar.open('Leave approved successfully', '', { duration: 3000 });
        this.getPaginatedLeaves();
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }

  rejectLeave(leaveId: any, note: string) {
    const rejectionData = { leaveId: leaveId, adminNotes: note };
    this.leaveService.updateRejectLeaveStatus(rejectionData).subscribe(
      (res) => {
        this.snackbar.open('Leave rejected successfully', '', { duration: 3000 });
        this.getPaginatedLeaves();
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }




  viewLeaveDetails(leaveId: number) {
    this.router.navigate(['/login/admin-leave/view/', leaveId], {
      queryParams: { leaveId: leaveId },
    });

  }

  enlargedItemId: number | null = null;

  toggleImageSize(itemId: number) {
    this.enlargedItemId = this.enlargedItemId === itemId ? null : itemId;
  }

  upload(action: string, leaveId: number): void {
    const dialogRef = this.dialog.open(UplaodDialogComponent, {
      data: { leaveId } , // Pass leaveId as part of the dialog data
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.fileUrl) {
        this.updateLeaveFileUrl(leaveId, result.fileUrl);
      } else {
        console.log('No file URL returned');
      }
    });
  }

  updateLeaveFileUrl(leaveId: number, fileUrl: string): void {
    this.leaveService.updateLeaveFileUrl(leaveId, fileUrl).subscribe({
      next: () => {
        this.getPaginatedLeaves()
      }});
  }
}
