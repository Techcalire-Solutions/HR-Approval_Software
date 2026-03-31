import { MatButtonModule } from '@angular/material/button';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { NewLeaveService } from '@services/new-leave.service';
import { Subscription } from 'rxjs';
import { Leave } from '../../../common/interfaces/leaves/leave';
import { SafePipe } from "../../../common/pipes/safe.pipe";
import { CommonModule } from '@angular/common';
import { UserLeave } from '../../../common/interfaces/leaves/userLeave';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
import { RoleService } from '@services/role.service';
import { Role } from '../../../common/interfaces/users/role';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-open-leave',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, SafePipe, CommonModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './open-leave.component.html',
  styleUrl: './open-leave.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OpenLeaveComponent implements OnInit, OnDestroy{

  private readonly route = inject(ActivatedRoute);
  userId: number;
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    const roleId = user.role
    this.getRoleById(roleId, user.id)

    const id = this.route.snapshot.params['id'];
    this.getLeaveById(id, user.id)
    this.userId = user.id;
  }

  private readonly roleService = inject(RoleService);
  private roleSub!: Subscription;
  roleName: string;
  employeeStat: boolean = false;
  getRoleById(id: number, userId: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe((res: Role) => {
      let roleName = res.abbreviation
      if(roleName === 'HR Admin' || roleName === 'Super Admin'){
        this.employeeStat = true;
        // this.getLeaveByUser(userId)
      }else{
        // this.getLeaves()
      }
    })
  }

  private leaveService = inject(NewLeaveService);
  leaveSub!: Subscription;
  isLoading: boolean = false;
  leave :Leave
  getLeaveById(id: number, loginId: number){
    this.isLoading = true;
    this.leaveSub = this.leaveService.getLeaveById(id).subscribe((res) => {
      this.leave = res; 
      this.isLoading = false;
      if(this.leave.user.userpersonal[0].reportingMangerId === loginId){
        this.employeeStat = true;
      }
      this.getUserLeaves(this.leave.userId)
    });
  }

  ulSub!: Subscription;
  userLeaves: UserLeave[] = [];
  getUserLeaves(id: number){
    this.isLoading = true;
    this.ulSub = this.leaveService.getUserLeaveByUser(id).subscribe((response: any) => {
      this.isLoading = false;
      this.userLeaves = response;
    });
  }

  private readonly snackbar = inject(MatSnackBar);
  private leaveBalSub!: Subscription;
    openDialog(action: string, leaveId: number): void {
  // If rejecting or marking as unapproved, skip balance check
  if (action === 'reject' || action === 'unapproved') {
    this.openNoteDialog(action, leaveId);
  } else if (action === 'approve') {
    this.leaveBalSub = this.leaveService.getLeaveBalance(leaveId).subscribe(
      (res: any) => {
        if (res.leaveType === 'LOP' || res.isSufficient) {
          this.openNoteDialog(action, leaveId);
        } else {
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
  // Determine the dynamic heading for the dialog
  let dialogHeading = 'Note';
  if (action === 'approve') dialogHeading = 'Approve Note';
  else if (action === 'unapproved') dialogHeading = 'Unapproved (LOP) Note';
  else if (action === 'reject') dialogHeading = 'Reject Note';

  const dialogRef = this.dialog.open(NoteDialogComponent, {
    data: {
      action,
      leaveId,
      heading: dialogHeading,
    },
  });

  this.dialogSub = dialogRef.afterClosed().subscribe(note => {
    if (note !== false) {
      // Logic to handle the three different paths
      if (action === 'approve') {
        this.approveLeave(leaveId, note);
      } else if (action === 'unapproved') {
        // We call approveLeave but pass the note and potentially an extra flag 
        // OR simply call approveLeave and let the service handle the status.
        this.processUnapprovedLeave(leaveId, note);
      } else {
        this.rejectLeave(leaveId, note);
      }
    } else {
      this.isLoading = false;
    }
  });
}

private processUnapprovedLeave(leaveId: number, note: any): void {
  const payload = {
    adminNotes: note,
    status: 'Unapproved' // Explicitly setting the status for the backend
  };
  
  // Using your existing service's update method
  this.leaveService.updateLeaveStatus(leaveId, payload).subscribe(
    (res) => {
      this.snackbar.open('Leave approved with Penalty (LOP)', 'Close', { duration: 3000 });
      // this.refreshData();
    },
    (err) => {
      this.snackbar.open('Error processing request', 'Close', { duration: 3000 });
    }
  );
}

  openDialogOLD(action: string, leaveId: number): void {
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
  private openNoteDialogOLD(action: string, leaveId: number): void {
    const dialogRef = this.dialog.open(NoteDialogComponent, {
      data: {
        action,
        leaveId,
        heading: action === 'approve' ? 'Approve Note' : 'Reject Note',
      },
    });

    this.dialogSub = dialogRef.afterClosed().subscribe(note => {
      this.isLoading = true;
      
      if (note !== false) {
        action === 'approve' ? this.approveLeave(leaveId, note) : this.rejectLeave(leaveId, note);
      }else{
        this.isLoading = false
      }
    });
  }

  approveSub!: Subscription;
  approveLeave(leaveId: any, note: string) {
    const approvalData = { leaveId: leaveId, adminNotes: note };
    this.approveSub = this.leaveService.updateApproveLeaveStatus(approvalData).subscribe(
      (res) => {
        this.isLoading = false;
        this.snackbar.open('Leave approved successfully', '', { duration: 3000 });
        this.getLeaveById(leaveId, this.userId);
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
        this.isLoading = false;
        this.snackbar.open('Leave rejected successfully', '', { duration: 3000 });
        this.getLeaveById(leaveId, this.userId);
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }

  ngOnDestroy(): void {
    this.leaveSub.unsubscribe();
    this.ulSub?.unsubscribe();
  }

}
