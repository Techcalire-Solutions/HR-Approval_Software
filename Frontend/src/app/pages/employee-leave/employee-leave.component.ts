import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
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
import { CamelCasePipe } from '../../theme/pipes/camel-case.pipe';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { Router } from '@angular/router';
import { LeaveGraphsComponent } from './leave-graphs/leave-graphs.component';

@Component({
  selector: 'app-employee-leave',
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
    LeaveGraphsComponent
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
  public page:any;
  snackBar = inject(MatSnackBar);
  roleService = inject(RoleService);
  settingsService = inject(SettingsService);
  dialog = inject(MatDialog);
  usersService = inject(UsersService);
  router = inject(Router)
  leaveService = inject(LeaveService)

userId:number
  ngOnInit(){
    this.getLeaveByUser()
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    this.userId = user.id;
   this.getLeaveByUser();
  }



  ngOnDestroy(): void {
    this.leaveSub.unsubscribe();
    if(this.delete){
      this.delete.unsubscribe();
    }

}


leaves:any[]=[]
  leaveSub :Subscription
  private getLeaveByUser(): void {
    if (!this.userId) return;
    this.leaveSub = this.leaveService.getLeavesByUser(this.userId, this.searchText, this.currentPage, this.pageSize).subscribe(
      (res: any) => {
        this.leaves = res.items;
        this.totalItems = res.count;
      },
      (error) => {
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      }
    );
  }


  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getLeaveByUser()
  }

  openApplyLeave(){
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




  editLeave(item:any) {
 this.router.navigate(['/login/employee-leave/add'], { queryParams: { id: item.id } });
  }



delete!: Subscription;
deleteLeaveStableFunction(id: number){
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.leaveService.deleteLeave(id).subscribe(res => {
          this.snackBar.open('Leave request deleted successfully!', 'Close', { duration: 3000 });
          this.getLeaveByUser()
        });
      }
    });
    this.leaves = this.leaves.filter(item => item.id !== id);
  }


  hasValidSessions(leaveDates: any[]): boolean {
    return leaveDates.some(date => date.session1 || date.session2);
  }


  deleteLeave(id: number): void {
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.delete = this.leaveService.deleteLeave(id).subscribe({
          next: (response) => {
            const leaveItem = this.leaves.find(leave => leave.id === id);
            if (leaveItem?.fileUrl) {
              this.leaveService.deleteUploadByurl(leaveItem.fileUrl).subscribe({
                next: () => {
                  this.snackBar.open('Leave request and file deleted successfully!', 'Close', { duration: 3000 });
                },
                error: () => {
                  this.snackBar.open('Leave request deleted, but file deletion failed!', 'Close', { duration: 3000 });
                }
              });
            } else {
              this.snackBar.open('Leave request deleted successfully, but no file was associated.', 'Close', { duration: 3000 });
            }

            this.getLeaveByUser();
          },
          error: (error) => {
            this.snackBar.open('Error deleting leave request!', 'Close', { duration: 3000 });
          }
        });
      }
    });

    this.leaves = this.leaves.filter(item => item.id !== id);
  }



}
