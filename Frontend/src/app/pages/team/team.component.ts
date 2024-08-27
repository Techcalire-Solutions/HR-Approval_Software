import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Settings, SettingsService } from '../../services/settings.service';

import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { User } from '../../common/models/user.model';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-team',
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
    UserDialogComponent
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class TeamComponent {
  public users: User[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  constructor(public settingsService: SettingsService,
              public dialog: MatDialog,
              public usersService: UsersService){
    this.settings = this.settingsService.settings;
  }

  ngOnInit() {
    this.getUsers();
    console.log("usersssssssssssssssssssssssssssss")
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

  public openUserDialog(user: any){
    let dialogRef = this.dialog.open(UserDialogComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      if(user){
          (user.id) ? this.updateUser(user) : this.addUser(user);
      }
    });
  }

}


