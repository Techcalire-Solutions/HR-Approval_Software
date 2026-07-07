/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatPaginatorModule } from '@angular/material/paginator';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UsersService } from '../../services/users.service';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { Router } from '@angular/router';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SeparationComponent } from './separation/separation.component';
import { User } from '../../common/interfaces/users/user';
import { UpdateDesignationComponent } from './update-designation/update-designation.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { LoginService } from '@services/login.service';
import { InvoiceService } from '@services/invoice.service';
import moment from 'moment';


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule, FlexLayoutModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatMenuModule, MatSlideToggleModule, MatCardModule, NgxPaginationModule, MatPaginatorModule
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
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)
    const userId = user.id;
    this.getUser(userId);
    this.getUsers()
  }

  loginUserSub:Subscription
  private loginService = inject(LoginService);
  private invoiceService = inject(InvoiceService);
  role!: string;
  getUser(id: number) {
    this.loginUserSub = this.loginService.getUserById(id).subscribe((res) => {
      const user = res;
      if (!user.userPosition || !user.userPosition.designation) {
          this.role = 'Employee';
      } else {
          this.role = user.userPosition.designation.designationName;
      }
    });
  }
  
  userSub!: Subscription;
  getUsers(): void {
    this.userSub = this.usersService.getUser(this.searchText, this.currentPage, this.pageSize).subscribe((users: any) =>{
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

    this.dialogSub = dialogRef.afterClosed().subscribe(() => {
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

resignEmployee(id: number, empNo: string, name: string, type: 'create' | 'update' = 'create') {
  // Safe cleanup if another instance was previously opened
  this.dialogSub?.unsubscribe();

  const dialogRef = this.dialog.open(SeparationComponent, {
    width: '450px',
    data: { id: id, empNo: empNo, name: name, type: type } // Passes 'create' or 'update' dynamically
  });

  this.dialogSub = dialogRef.afterClosed().subscribe((res) => {
    if (res && res.confirmed) {
      this.rsignSub?.unsubscribe(); 
      
      this.rsignSub = this.usersService.resignEmployee(id, res).subscribe(() => {
        const todayStr = moment().format('YYYY-MM-DD'); 
        let snackMessage = `${empNo} is now marked as resigned`;
        
        // Dynamic messaging based on whether it was an update or initial creation
        if (type === 'update') {
          snackMessage = `Separation details updated for ${name} (${empNo})`;
        } else if (res.date && res.date > todayStr) {
          snackMessage = `${name} (${empNo}) is serving notice until ${this.formatSnackbarDate(res.date)}`;
        } else {
          snackMessage = `${name} (${empNo}) has been separated successfully`;
        }

        this.snackbar.open(snackMessage, "", { duration: 4000 });
        
        this.searchText = '';
        this.getUsers(); 
      });
    }
  });
}





formatSnackbarDate(dateStr: string): string {
  return moment(dateStr).format('DD/MM/YYYY');
}

  // Quick helper to make the snackbar date look nice (YYYY-MM-DD to DD-MM-YYYY)


  openPayRoll(id: number){
    this.router.navigateByUrl('login/users/payroll/'+id)
  }

  openPromotion(id: number){
    this.router.navigateByUrl('login/users/promotion/'+id)
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

  snackBar = inject(MatSnackBar)
  confirmSub!: Subscription;
  private userService = inject(UsersService);
  confirmEmployee(id: number, empNo: string, name: string, isTemporary: boolean){
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {id: id, empNo: empNo, name: name, isTemporary: isTemporary}
    });
    this.dialogSub = dialogRef.afterClosed().subscribe((res) => {
      if(res.confirmed){
        this.confirmSub = this.userService.confirmEmployee(id, res.note).subscribe((x) =>{
          this.snackBar.open(`${name} ${x.message}`,"" ,{duration:3000})
            this.getUsers()
        })
      }
    })
  }
}
