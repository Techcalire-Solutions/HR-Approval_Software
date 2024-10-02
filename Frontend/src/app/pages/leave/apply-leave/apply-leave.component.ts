import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoleService } from '@services/role.service';
import { SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { Role } from '../../../common/interfaces/role';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../../theme/pipes/pipes.module';
import { UserDialogComponent } from '../../users/user-dialog/user-dialog.component';
import { Router } from '@angular/router';
import { LeaveService } from '@services/leave.service';

@Component({
  selector: 'app-apply-leave',
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
    MatPaginatorModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
    UsersService
  ],
  templateUrl: './apply-leave.component.html',
  styleUrls: ['./apply-leave.component.scss']
})
export class ApplyLeaveComponent implements OnInit {
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
    this.getRoles()
    this.getLeaveByUser()

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)
    console.log(user)
    this.userId = user.id;
   console.log(this.userId)
    // Check if userId is defined before calling getLeaveByUser
    if (this.userId) {
      this.getLeaveByUser(); // Call only if userId is valid
  } else {
      console.error('User ID is undefined');
      // Handle case where userId is undefined (e.g., show a message or redirect)
  }
  }

  roles: Role[] = [];
  roleSub!: Subscription;
  getRoles(){
    this.roleSub = this.roleService.getRole(this.searchText, this.currentPage, this.pageSize).subscribe((res: any)=>{
      this.roles = res.items;
      this.totalItems = res.count;
      console.log(this.roles);
    })
  }
leaves:any[]=[]
  leaveSub :Subscription
  private getLeaveByUser() {
    if (!this.userId) return; // If userId is not available, don't proceed

    this.leaveSub = this.leaveService.getLeavesByUser(this.userId).subscribe(
      (res) => {
        console.log('Fetched leaves for user', this.userId, res);
        this.leaves = res; // Store the leave data in the component
      },
      (error) => {
        console.error('Error fetching leaves:', error);
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      }
    );
  }


  // Function to check if the role is restricted
  isRestrictedRole(roleName: string): boolean {
    const restrictedRoles = [
      'Sales Executive',
      'Key Account Manager',
      'Manager',
      'Accountant',
      'Team Lead',
      'Administrator',
      'Approval Administrator',
      'HR Administrator',
      'Super Administrator',
      'HR'
    ];
    return restrictedRoles.includes(roleName);
  }

  // Other functions like openRoleDialog, deleteRole...

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getRoles()
  }


  delete!: Subscription;
  deleteRole(id: number){
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.roleService.deleteRole(id).subscribe(res => {
          this.snackBar.open("Role deleted successfully...","" ,{duration:3000})
          this.getRoles()
        });
      }
    });
  }

openRoleDialog(){
    console.log("clkickeddddddddddddd")
    this.router.navigate(['/addLeave'])
  }

  openApplyLeave(){
    console.log("clkickeddddddddddddd")
    this.router.navigate(['/login/addLeave'])

  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 5;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getRoles();
  }

  ngOnDestroy(): void {
    this.roleSub?.unsubscribe();
    this.delete?.unsubscribe();

      this.leaveSub.unsubscribe();

  }

  editLeave(id:number){

  }
  deleteLeave(id:number){
    
  }
}
