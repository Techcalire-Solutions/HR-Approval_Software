import { Component, inject, ViewChild } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
// import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../../theme/pipes/pipes.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { SettingsService } from '@services/settings.service';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { AddLeaveTypeDialogueComponent } from './add-leave-type-dialogue/add-leave-type-dialogue.component';
import { LeaveService } from '@services/leave.service';
import { LeaveType } from '../../../common/interfaces/leaves/leaveType';
@Component({
  selector: 'app-leave-types',
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

    CommonModule,
    MatPaginatorModule
  ],
    providers: [DatePipe],
  templateUrl: './leave-types.component.html',
  styleUrl: './leave-types.component.scss'
})
export class LeaveTypesComponent {
  public page:any;
  snackBar = inject(MatSnackBar)
  settingsService= inject(SettingsService)
  dialog=inject(MatDialog)
  leaveService=inject(LeaveService)


  ngOnInit(){
    this.getLeaveTypes()
  }

  leaveTypes: LeaveType[] = [];
  roleSub!: Subscription;
  getLeaveTypes(){
    this.roleSub = this.leaveService.getLeaveType(this.searchText, this.currentPage, this.pageSize).subscribe((res: any)=>{
      this.leaveTypes = res.items;
      this.totalItems = res.count;
      console.log('hiii',res);

    })
  }


  // Other functions like openRoleDialog, deleteRole...

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getLeaveTypes()
  }


  delete!: Subscription;
  deleteRole(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});

    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.leaveService.deleteLeaveType(id).subscribe(res => {
          this.snackBar.open("Leave Type deleted successfully...","" ,{duration:3000})
          this.getLeaveTypes()
        });
      }
    });
  }

  public openLeaveTypeDialog(leaveType: any){
    const dialogRef = this.dialog.open(AddLeaveTypeDialogueComponent, {
      data: leaveType
    });
    console.log('leaveType',leaveType);

    dialogRef.afterClosed().subscribe(() => {
      this.getLeaveTypes()
    });
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getLeaveTypes();
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.delete?.unsubscribe();
  }

}
