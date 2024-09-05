import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { User } from '../../common/models/user.model';
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
    PipesModule,
    DatePipe,
    UserDialogComponent,
    CommonModule,
    SafePipe
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class UsersComponent implements OnInit {
  apiUrl = environment.apiUrl;
  public users: User[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  constructor(private _snackbar: MatSnackBar,private sanitizer: DomSanitizer,
    public settingsService: SettingsService,
              public dialog: MatDialog,
              public usersService: UsersService){
    this.settings = this.settingsService.settings;
  }

  ngOnInit() {
    this.getUsers();


  }
  getSanitizedUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
  public getUsers(): void {
    this.users = null; //for show spinner each time
    this.usersService.getUser().subscribe((users: any) =>{
      console.log(users);

      this.users = users
    });
  }
  public addUser(user:User){
    this.usersService.addUser(user).subscribe(user => this.getUsers());
  }
  public updateUser(user:User){
    this.usersService.updateUser(user).subscribe(user => this.getUsers());
  }
  public deleteUser(user:User){
    this.usersService.deleteUser(user.id).subscribe(user => this.getUsers());
  }


  public onPageChanged(event: any){
    this.page = event;
    this.getUsers();
    if(this.settings.fixedHeader){
        document.getElementById('main-content')!.scrollTop = 0;
    }
    else{
        document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
    }
  }
  public userImage = 'img/users/avatar.png';

  public openUserDialog(user: any){
    let dialogRef = this.dialog.open(UserDialogComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      this.getUsers()
      // if(user){
      //     (user.id) ? this.updateUser(user) : this.addUser(user);
      // }
    });
  }



  deleteFunction(id: number){
    console.log(id);  // Check the value of id here
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
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
