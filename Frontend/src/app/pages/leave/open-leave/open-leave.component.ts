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

@Component({
  selector: 'app-open-leave',
  standalone: true,
  imports: [MatCardModule, MatChipsModule, MatIconModule, SafePipe, CommonModule, MatButtonModule],
  templateUrl: './open-leave.component.html',
  styleUrl: './open-leave.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OpenLeaveComponent implements OnInit, OnDestroy{

  private readonly route = inject(ActivatedRoute);
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    const roleId = user.role
    this.getRoleById(roleId, user.id)

    const id = this.route.snapshot.params['id'];
    this.getLeaveById(id, user.id)

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
  leave :Leave
  getLeaveById(id: number, loginId: number){
    this.leaveSub = this.leaveService.getLeaveById(id).subscribe((res) => {
      this.leave = res;
      console.log(this.leave);
      
      if(this.leave.user.userpersonal[0].reportingMangerId === loginId){
        this.employeeStat = true;
      }
      this.getUserLeaves(this.leave.userId)
    });
  }

  ulSub!: Subscription;
  userLeaves: UserLeave[] = [];
  getUserLeaves(id: number){
    this.ulSub = this.leaveService.getUserLeaveByUser(id).subscribe((response: any) => {
      this.userLeaves = response;
    });
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
        // this.getLeaveById();
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
        // this.getLeaves();
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
