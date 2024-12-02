/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatPaginatorModule } from '@angular/material/paginator';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { Settings, SettingsService } from '../../services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { Router } from '@angular/router';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SeparationComponent } from './separation/separation.component';
import { User } from '../../common/interfaces/users/user';
import { UpdateDesignationComponent } from './update-designation/update-designation.component';


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
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
    MatPaginatorModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class UsersComponent implements OnInit, OnDestroy {
  apiUrl ='https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  public users: User[];
  public page:any;
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private usersService = inject(UsersService);

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.updateSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
  }

  ngOnInit() {
    this.getUsers()
  }

  userSub!: Subscription;
  getUsers(): void {
    console.log(this.searchText);
    
    this.userSub = this.usersService.getUser(this.searchText, this.currentPage, this.pageSize).subscribe((users: any) =>{
      console.log(users);
      
      this.users = users.items;
      this.totalItems = users.count
    });
  }

  pageSize = 6;
  currentPage = 1;
  totalItems = 0;
  public onPageChanged(event: any){
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getUsers()
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    console.log(this.searchText);
    
    this.getUsers()
  }

  public userImage = 'img/users/avatar.png';

  public openUserDialog(user: any) {
    if (user) {
      this.router.navigate(['/login/users/edit/' + user.id]);
    } else {
      this.router.navigate(['/login/users/new']);
    }
  }

  dialogSub!: Subscription;
  updateDesignation(id: number, name: string, empNo: string){
    const dialogRef = this.dialog.open(UpdateDesignationComponent, {
      width: '600px',
      data: {id: id, name: name, empNo: empNo}
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      this.getUsers()
    });
  }

  deleteFunction(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '320px',
      data: {}
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.usersService.deleteUser(id).subscribe(() => {
          this.snackbar.open("User deleted successfully...", "", { duration: 3000 });
          this.searchText = '';
          this.getUsers();
        }, (error) => {
          this.snackbar.open(error.error.message, "", { duration: 3000 });
        });
      }
    });
  }

  viewEmployee(id: number){
    this.router.navigate(['/login/users/view/' + id]);
  }

  deleteImage(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '450px',
      data: {}
    });

    this.dialogSub = dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.usersService.deleteUserImage(id).subscribe(() => {
          this.snackbar.open("User image deleted successfully...", "", { duration: 3000 });
          this.getUsers();
        }, (error) => {
          this.snackbar.open(error.error.message, "", { duration: 3000 });
        });
      }
    });
  }

  resetPassword(id: number, empNo: string){
    const dialogRef = this.dialog.open(ResetPasswordComponent, {
      width: '450px',
      data: {id: id, empNo: empNo, paswordReset: false}
    });
    this.dialogSub = dialogRef.afterClosed().subscribe(() => {

    })
  }

  updateSub!: Subscription;
  updateStatus(event: any, id: number, name: string){
    const data = { status: event.checked }
    this.updateSub = this.usersService.updateUserStatus(data, id).subscribe(() => {
      if (event.checked) {
        this.snackbar.open(`${name} is now in active state`, "", { duration: 3000 });
      } else {
        this.snackbar.open(`${name} is now in inactive state`, "", { duration: 3000 });
      }
      this.getUsers()
    });
  }

  rsignSub!: Subscription;
  resignEmployee(id: number, empNo: string, name: string){
    const dialogRef = this.dialog.open(SeparationComponent, {
      width: '450px',
      data: {id: id, empNo: empNo, name: name}
    });
    this.dialogSub = dialogRef.afterClosed().subscribe((res) => {
      this.rsignSub = this.usersService.resignEmployee(id, res).subscribe(() => {
        this.snackbar.open(`${empNo} is now resigned`, "", { duration: 3000 });
        this.searchText = '';
        this.getUsers()
      })
    })
  }

  openPayRoll(id: number){
    this.router.navigateByUrl('login/users/payroll/'+id)
  }

  openAssets(id: number){
    this.router.navigateByUrl('/login/users/assets/'+id)
  }

  viewSeparated(){
    this.router.navigateByUrl('/login/users/separated')
  }

  selectedEmployee: any;
  isEmployeeSelected(user: any): boolean {
    return this.selectedEmployee && this.selectedEmployee.id === user.id;
  }
}
