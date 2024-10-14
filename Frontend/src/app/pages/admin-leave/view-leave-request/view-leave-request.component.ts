import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
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
import { Leave } from '../../../common/interfaces/leave';
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
    CamelCasePipe
  ],
  templateUrl: './view-leave-request.component.html',
  styleUrl: './view-leave-request.component.scss'
})
export class ViewLeaveRequestComponent {
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
    this.leaves = res.leave;
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





  approveLeave(leaveId: any) {
    this.leaveService.updateApproveLeaveStatus(leaveId).subscribe(
      (res) => {
        this.snackbar.open('Leave approved successfully', '', { duration: 3000 });
        this.getPaginatedLeaves();
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      }
    );
  }

rejectLeave(leaveId: any){
  this.leaveService.updateRejectLeaveStatus(leaveId).subscribe(
    (res) => {
      this.snackbar.open('Leave rejected successfully', '', { duration: 3000 });
      this.getPaginatedLeaves();
    },
    (error) => {
      this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
    }
  );
}




}
