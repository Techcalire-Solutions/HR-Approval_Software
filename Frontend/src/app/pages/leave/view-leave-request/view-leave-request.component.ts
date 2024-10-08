import { Component, inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator,MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LeaveService } from '@services/leave.service';
import { RoleService } from '@services/role.service';
import { SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';

import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';
import { MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import {MatTableModule} from '@angular/material/table';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../../theme/pipes/pipes.module';
import { UserDialogComponent } from '../../users/user-dialog/user-dialog.component';

import { CamelCasePipe } from '../../../common/camel-case.pipe';
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

userId:number
  ngOnInit(){
    this.getLeaves()
  //   const token: any = localStorage.getItem('token')
  //   let user = JSON.parse(token)
  //   this.userId = user.id;
  //  this.getLeaveByUser();
  }

  getLeaveSub : Subscription
  leaves:any[]=[]
  totalItemsCount = 0;
  getLeaves() {
    this.getLeaveSub = this.leaveService.getLeaves().subscribe(
      (res) => {
        console.log('res', res);

        // Assuming `res.items` contains the array of leaves
        this.leaves = res;
        // this.totalItemsCount = res.count;

        // console.log('leaves', this.leaves);
        // console.log('totalItemsCount', this.totalItemsCount);
      },
      (error) => {
        // Handle any errors
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      }
    );
  }


  ngOnDestroy(): void {
    // this.leaveSub.unsubscribe();


}


// leaves:any[]=[]
  // leaveSub :Subscription
  // private getLeaveByUser(): void {
  //   if (!this.userId) return;

  //   console.log(this.userId)

  //   this.leaveSub = this.leaveService.getLeavesByUser(this.userId, this.searchText, this.currentPage, this.pageSize).subscribe(
  //     (res: any) => {

  //       this.leaves = res.items;
  //       this.totalItems = res.count;
  //     },
  //     (error) => {
  //       this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
  //     }
  //   );
  // }


  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    // this.getLeaveByUser()
  }

  openApplyLeave(){
    this.router.navigate(['/login/leave/add'])

  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 5;
  currentPage = 1;
  totalItems = 0;

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getLeaves()
  }

  approveLeave(leaveId: any) {
    this.leaveService.updateApproveLeaveStatus(leaveId).subscribe(
      (res) => {
        console.log('Leave approved:', res);
        this.snackbar.open('Leave approved successfully', '', { duration: 3000 });
        this.getLeaves(); // Refresh leave data after approval
      },
      (error) => {
        this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
        console.error('Error approving leave:', error);
      }
    );
  }

rejectLeave(leaveId: any){
  this.leaveService.updateRejectLeaveStatus(leaveId).subscribe(
    (res) => {
      console.log('Leave Rejected:', res);
      this.snackbar.open('Leave rejected successfully', '', { duration: 3000 });
      this.getLeaves(); // Refresh leave data after approval
    },
    (error) => {
      this.snackbar.open('Failed to approve leave', '', { duration: 3000 });
      console.error('Error approving leave:', error);
    }
  );
}




}
