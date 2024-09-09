import { MatPaginatorModule } from '@angular/material/paginator';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { Settings, SettingsService } from '../../services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
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
import { PipesModule } from '../../theme/pipes/pipes.module';
import { MatCardModule } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../add-approval/view-invoices/safe.pipe';
import { DeleteConfirmDialogComponent } from '../add-approval/delete-confirm-dialog/delete-confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { User } from '../../common/interfaces/user';
import { count, Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';


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
    DatePipe,
    UserDialogComponent,
    CommonModule,
    SafePipe,
    MatPaginatorModule
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class UsersComponent implements OnInit {
  apiUrl = environment.apiUrl;
  public users: User[];
  public page:any;
  public settings: Settings;
  constructor(private _snackbar: MatSnackBar,private sanitizer: DomSanitizer,
    public settingsService: SettingsService,
              public dialog: MatDialog,
              public usersService: UsersService){
    this.settings = this.settingsService.settings;
  }

  ngOnInit() {
    this.getUsers()
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

  public openUserDialog(user: any){
    let dialogRef = this.dialog.open(UserDialogComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      this.getUsers()
    });
  }

  deleteFunction(id: number){
    console.log(id);  // Check the value of id here
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {
      width: '450px',
      data: {}
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.usersService.deleteUser(id).subscribe((res) => {
          console.log(res);
          this._snackbar.open("User deleted successfully...", "", { duration: 3000 });
          this.getUsers();
        }, (error) => {
          console.log(error);
          this._snackbar.open(error.error.message, "", { duration: 3000 });
        });
      }
    });
  }
}
