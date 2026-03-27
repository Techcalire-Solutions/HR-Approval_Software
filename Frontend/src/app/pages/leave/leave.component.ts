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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {MatTabsModule} from '@angular/material/tabs';
import { UsersComponent } from '../users/users.component';
import { UsersService } from '@services/users.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatIconModule, SafePipe, MatPaginatorModule, CommonModule, RouterModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatTabsModule
  ],
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.scss'
})
export class LeaveComponent implements OnInit, OnDestroy{
  private roleId: number;
  private id: number;
  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)
    this.id = user.id;
    this.roleId = user.role
    console.log(user);
    
    this.getRoleById(this.roleId, this.id)
    this.value = 'Not'
  }

  value: string;
  onTabChange(i: number){
    if(i === 1){
      this.value = 'Locked'
      this.getRoleById(this.roleId, this.id)
    }else{
      this.value = 'Not'
      this.getRoleById(this.roleId, this.id)
    }
  }

  private readonly roleService = inject(RoleService);
  private roleSub!: Subscription;
  roleName: string;
  employeeStat: boolean = false;
  userId: number = 0;
  private readonly userService = inject(UsersService) 
  getRoleById(id: number, userId: number){
    this.userService.getUserById(userId).subscribe(res=>{
      if(res.userPosition?.designation?.designationName === 'HR & Admin Assistant'){
          this.getLeaves()
      }else{
          this.roleSub = this.roleService.getRoleById(id).subscribe((res: Role) => {
            this.roleName = res.abbreviation
            if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
              this.employeeStat = true;
              this.getLeaveByUser(userId)
              this.getUserLeaves(userId)
              this.userId = userId;
            }else{
              this.getLeaves()
            }
          })
      }
    })
  }

  getUserLeaves(id: number){
    this.leaveService.getUserLeaveByUser(id).subscribe(res => {
    })
  }

 removePenalty(item: any) {
  const confirmAction = confirm("Are you sure you want to remove the penalty? This will reset the LOP penalty to 0.");
  
  if (confirmAction) {
    // Call the specific removePenalty endpoint
    this.leaveService.removePenalty(item.id).subscribe({
      next: (res) => {
        this.snackBar.open("Penalty removed successfully", "Close", { 
          duration: 3000,
          panelClass: ['success-snackbar'] 
        });
        this.getLeaves(); // Refresh data to show updated notes and hidden button
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open("Error removing penalty: " + err.error.message, "Close", { duration: 3000 });
      }
    });
  }
}

waiveApprovedPenalty(item: any) {
  const confirmAction = confirm(`This will decrease the user's LOP count by ${item.penaltyLOP} day(s). Proceed?`);
  
  if (confirmAction) {
    this.leaveService.removeApprovedPenalty(item.id).subscribe({
      next: (res) => {
        this.snackBar.open("LOP balance adjusted successfully", "Close", { duration: 3000 });
        this.getLeaves(); // Refresh the table to hide the button
      },
      error: (err) => {
        this.snackBar.open("Error: " + err.error.message, "Close", { duration: 3000 });
      }
    });
  }
}
  private readonly leaveService = inject(NewLeaveService);

  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  searchText: string = '';
  leaves: Leave[] = [];
  leaveSub!: Subscription;
  getLeaves(){
    this.leaveSub = this.leaveService.getLeavesPaginated(this.value, this.searchText, this.currentPage, this.pageSize).subscribe((leaves: any) => {
      this.leaves = leaves.items;
      this.filteredLeaves = this.leaves
      this.totalItems = leaves.count;
    })
  }

  isButtonVisible: boolean = false;
  private readonly snackBar = inject(MatSnackBar);
  private getLeaveByUser(id: number): void {
    if (!id) return;
    this.leaveSub = this.leaveService.getLeavesByUser(this.value, id, this.searchText, this.currentPage, this.pageSize).subscribe(
      (res: any) => {
        this.leaves = res.items;
        this.filteredLeaves = this.leaves
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

  filteredLeaves: Leave[] = [];
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    if(this.roleName === 'HR Admin' || this.roleName === 'Super Admin'){
      this.getLeaves()
    }else{
      this.getLeaveByUser(this.userId)
    }
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

// New helper method to ensure the correct status is sent
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


  private readonly dialog = inject(MatDialog);
  private dialogSub!: Subscription;
  isLoading: boolean = false;
  approveSub!: Subscription;
  approveLeave(leaveId: any, note: string) {
    this.isLoading = true;
    const approvalData = { leaveId: leaveId, adminNotes: note };
    this.approveSub = this.leaveService.updateApproveLeaveStatus(approvalData).subscribe(
      (res) => {
        this.isLoading = false
        this.snackbar.open('Leave approved successfully', '', { duration: 3000 });
        if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
          this.employeeStat = true;
          this.getLeaveByUser(this.userId)
        }else{
          this.getLeaves()
        }
      },
      (error) => {
        this.isLoading = false
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }

  rejectSub!: Subscription;
  rejectLeave(leaveId: any, note: string) {
    this.isLoading = true;
    const rejectionData = { leaveId: leaveId, adminNotes: note };
    this.rejectSub = this.leaveService.updateRejectLeaveStatus(rejectionData).subscribe(
      (res) => {
        this.isLoading = false;
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
      data: { leaveId },
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
        this.isLoading = true;
        const leaveItem = this.leaves.find((leave) => leave.id === leaveId);

        this.deleteSub = this.leaveService.deleteUntakenLeave(leaveId).subscribe({
          next: () => {
            this.isLoading = false;
            this.snackbar.open('Leave deleted successfully...', 'Close', { duration: 3000 });
            if(this.roleName !== 'HR Admin' && this.roleName !== 'Super Admin'){
              this.employeeStat = true;
              this.getLeaveByUser(this.userId)
            }else{
              this.getLeaves()
            }
          //   if (leaveItem?.fileUrl) {
          //     // Call API to delete associated file
          //     // this.deleteFileSub = this.leaveService.deleteUploadByurl(leaveItem.fileUrl).subscribe({
          //     //   next: () => {
          //     //     this.snackbar.open('Leave deleted and file removed successfully!', 'Close', { duration: 3000 });
          //     //   },
          //     //   error: () => {
          //     //     this.snackbar.open('Leave deleted, but file removal failed!', 'Close', { duration: 3000 });
          //     //   }
          //     // });
          //   } else {
          //     this.snackbar.open('Leave deleted successfully, no associated file found.', 'Close', { duration: 3000 });
            // }
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
