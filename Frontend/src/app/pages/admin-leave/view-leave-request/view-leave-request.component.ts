import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
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
import {MatTableModule} from '@angular/material/table';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { CamelCasePipe } from '../../../theme/pipes/camel-case.pipe';
import { PipesModule } from '../../../theme/pipes/pipes.module';
import { UserDialogComponent } from '../../users/user-dialog/user-dialog.component';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { EditLeaveComponent } from '../edit-leave/edit-leave.component';
import { NoteDialogComponent } from '../note-dialog/note-dialog.component';
@Component({
  selector: 'app-view-leave-request',
  standalone: true,
  imports: [
    MatTableModule,
    MatInputModule ,
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
    UserDialogComponent,
    CommonModule,
    MatPaginatorModule,
    CamelCasePipe,
    RouterModule
  ],
  templateUrl: './view-leave-request.component.html',
  styleUrl: './view-leave-request.component.scss'
})
export class ViewLeaveRequestComponent implements OnInit, OnDestroy {
  public page:any;
  snackBar = inject(MatSnackBar);
  roleService = inject(RoleService);
  settingsService = inject(SettingsService);
  dialog = inject(MatDialog);
  usersService = inject(UsersService);
  router = inject(Router)
  leaveService = inject(LeaveService)
  snackbar=inject(MatSnackBar)
  leaveSub : Subscription

userId:number

  ngOnInit(){
    this.getPaginatedLeaves()
     // Get the leaveId from the route parameters
  // Get the leaveId from the route parameters


  }

pageSize = 5;
currentPage = 1;
totalItems = 0;
searchText: string = '';

leaves:any[]=[]
getPaginatedLeaves(): void {
 this.leaveSub = this.leaveService.getLeavesPaginated(this.searchText, this.currentPage, this.pageSize).subscribe((res:any) => {
    console.log(res);
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

search(event: Event){
  this.searchText = (event.target as HTMLInputElement).value.trim()
  // this.getLeaveByUser()
}


  editLeave(id: number, status: string) {
    this.router.navigate(['/login/admin-leave/update-emergency-leave'], { queryParams: { id: id } });
  }



delete!: Subscription;
deleteLeave(id: number){
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.leaveService.deleteLeave(id).subscribe(res => {
          this.snackBar.open('Leave request deleted successfully!', 'Close', { duration: 3000 });
          this.getPaginatedLeaves()
        });
      }
    });
  }
  ngOnDestroy(): void {
    this.leaveSub.unsubscribe();


}


  openCalendar(){
    this.router.navigate(['login/leave/leaveCalendar']);

  }








onDeleteLeave(leaveId: number): void {

  const dialogRef = this.dialog.open(DeleteDialogueComponent, {
    data: { leaveId: leaveId }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result === true) {
      this.leaveService.deleteUntakenLeave(leaveId).subscribe(
        (response) => {
          this.snackBar.open('Leave request deleted successfully...', 'Close', { duration: 3000 });
          console.log(response)
          this.getPaginatedLeaves();
        },
        (error) => {
          console.error('Error deleting leave:', error);

        }
      );
    }
  });
}






  onEditLeave(leaveId: number): void {
    console.log('Navigating with Leave ID:', leaveId);
    this.router.navigate(['/login/admin-leave/edit/',leaveId], {
      queryParams: { leaveId: leaveId },
    });
  }




  openDialog(action: string, leaveId: string): void {
    if (action === 'reject') {
      this.openNoteDialog(action, leaveId);
    } else if (action === 'approve') {
      this.leaveService.getLeaveBalance(leaveId).subscribe(
        (res: any) => {
          console.log(res);

          if (res.isSufficient) {
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

  private openNoteDialog(action: string, leaveId: string): void {
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

  rejectLeave(leaveId: any, note: string){
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




  viewLeaveDetails(leaveId:number){
    this.router.navigate(['/login/admin-leave/view/',leaveId], {
      queryParams: { leaveId: leaveId },
    });

  }

}
