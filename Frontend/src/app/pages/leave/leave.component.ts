import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { SafePipe } from "../../common/pipes/safe.pipe";
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Leave } from '../../common/interfaces/leaves/leave';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NoteDialogComponent } from './note-dialog/note-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NewLeaveService } from '@services/new-leave.service';
import { UplaodDialogComponent } from './uplaod-dialog/uplaod-dialog.component';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RoleService } from '@services/role.service';
import { Role } from '../../common/interfaces/users/role';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatIconModule, SafePipe, MatPaginatorModule, CommonModule, RouterModule, MatInputModule,
    MatButtonModule
  ],
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.scss'
})
export class LeaveComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    const roleId = user.role
    this.getRoleById(roleId, user.id)
  }

  private readonly roleService = inject(RoleService);
  private roleSub!: Subscription;
  roleName: string;
  employeeStat: boolean = false;
  userId: number = 0;
  getRoleById(id: number, userId: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe((res: Role) => {
      this.roleName = res.abbreviation
      if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
        this.employeeStat = true;
        this.getLeaveByUser(userId)
        this.userId = userId;
      }else{
        this.getLeaves()
      }
    })
  }

  private readonly leaveService = inject(NewLeaveService);

  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  searchText: string = '';
  leaves: Leave[] = [];
  leaveSub!: Subscription;
  getLeaves(){
    this.leaveSub = this.leaveService.getLeavesPaginated(this.searchText, this.currentPage, this.pageSize).subscribe((leaves: any) => {
      this.leaves = leaves.items;
      this.totalItems = leaves.count;
    })
  }

  isButtonVisible: boolean = false;
  private readonly snackBar = inject(MatSnackBar);
  private getLeaveByUser(id: number): void {
    if (!id) return;
    this.leaveSub = this.leaveService.getLeavesByUser(id, this.searchText, this.currentPage, this.pageSize).subscribe(
      (res: any) => {
        this.leaves = res.items;
        this.totalItems = res.count;

        const totalSickLeave = this.leaves
          .filter(leave => leave.leaveType?.leaveTypeName === 'Sick Leave')
          .reduce((total, leave) => total + (leave.noOfDays || 0), 0);

        this.isButtonVisible = totalSickLeave >= 3;
      },
      (error) => {
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      }
    );
  }


  search(event: Event) {
    this.searchText = (event.target as HTMLInputElement).value.trim();
    if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
      this.employeeStat = true;
      this.getLeaveByUser(this.userId)
    }else{
      this.getLeaves()
    }
  }

  private readonly snackbar = inject(MatSnackBar);
  private leaveBalSub!: Subscription;
  openDialog(action: string, leaveId: number): void {
    if (action === 'reject') {
      this.openNoteDialog(action, leaveId);
    } else if (action === 'approve') {
      this.leaveBalSub = this.leaveService.getLeaveBalance(leaveId).subscribe(
        (res: any) => {
          if (res.leaveType === 'LOP' || res.isSufficient) {
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

  private readonly dialog = inject(MatDialog);
  private dialogSub!: Subscription;
  private openNoteDialog(action: string, leaveId: number): void {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      data: {
        action,
        leaveId,
        heading: action === 'approve' ? 'Approve Note' : 'Reject Note',
      },
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(note => {
      if (note) {
        action === 'approve' ? this.approveLeave(leaveId, note) : this.rejectLeave(leaveId, note);
      }
    });
  }

  approveSub!: Subscription;
  approveLeave(leaveId: any, note: string) {
    const approvalData = { leaveId: leaveId, adminNotes: note };
    this.approveSub = this.leaveService.updateApproveLeaveStatus(approvalData).subscribe(
      (res) => {
        this.snackbar.open('Leave approved successfully', '', { duration: 3000 });
        if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
          this.employeeStat = true;
          this.getLeaveByUser(this.userId)
        }else{
          this.getLeaves()
        }
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }

  rejectSub!: Subscription;
  rejectLeave(leaveId: any, note: string) {
    const rejectionData = { leaveId: leaveId, adminNotes: note };
    this.rejectSub = this.leaveService.updateRejectLeaveStatus(rejectionData).subscribe(
      (res) => {
        this.snackbar.open('Leave rejected successfully', '', { duration: 3000 });
        if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
          this.employeeStat = true;
          this.getLeaveByUser(this.userId)
        }else{
          this.getLeaves()
        }
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }

  upload(action: string, leaveId: number): void {
    const dialogRef = this.dialog.open(UplaodDialogComponent, {
      data: { leaveId } , // Pass leaveId as part of the dialog data
      width: '400px',
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(result => {
      if (result && result.fileUrl) {
        this.updateLeaveFileUrl(leaveId, result.fileUrl);
      } else {
        console.log('No file URL returned');
      }
    });
  }

  fileSub!: Subscription;
  updateLeaveFileUrl(leaveId: number, fileUrl: string): void {
    this.fileSub = this.leaveService.updateLeaveFileUrl(leaveId, fileUrl).subscribe({
    next: () => {
      if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
        this.employeeStat = true;
        this.getLeaveByUser(this.userId)
      }else{
        this.getLeaves()
      }
    }});
  }

  private readonly router = inject(Router)
  onEditLeave(leaveId: number): void {
    this.router.navigate([`/login/leave/edit/${leaveId}`]);
  }

  deleteSub!: Subscription;
  deleteFileSub!: Subscription;
  onDeleteLeave(leaveId: number): void {
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      data: { leaveId: leaveId }
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Find the leave item to check for associated file
        const leaveItem = this.leaves.find((leave) => leave.id === leaveId);

        this.deleteSub = this.leaveService.deleteUntakenLeave(leaveId).subscribe({
          next: () => {
            if (leaveItem?.fileUrl) {
              // Call API to delete associated file
              this.deleteFileSub = this.leaveService.deleteUploadByurl(leaveItem.fileUrl).subscribe({
                next: () => {
                  this.snackbar.open('Leave deleted and file removed successfully!', 'Close', { duration: 3000 });
                },
                error: () => {
                  this.snackbar.open('Leave deleted, but file removal failed!', 'Close', { duration: 3000 });
                }
              });
            } else {
              this.snackbar.open('Leave deleted successfully, no associated file found.', 'Close', { duration: 3000 });
            }
            if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
              this.employeeStat = true;
              this.getLeaveByUser(this.userId)
            }else{
              this.getLeaves()
            }
          },
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
      this.employeeStat = true;
      this.getLeaveByUser(this.userId)
    }else{
      this.getLeaves()
    }
  }

  openCalendar(){
    this.router.navigate([`/login/leave/add`]);
  }

  openLeaveCalendar(){
    this.router.navigate([`/login/leave/leave-calendar`]);
  }

  ngOnDestroy(): void {
    this.leaveSub?.unsubscribe();
    this.leaveBalSub?.unsubscribe();
    this.deleteSub?.unsubscribe();
    this.deleteFileSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
    this.fileSub?.unsubscribe();
    this.approveSub?.unsubscribe();
    this.rejectSub?.unsubscribe();
  }

}
