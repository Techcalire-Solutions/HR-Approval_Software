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
import { UsersService } from '../../services/users.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TeamService } from '@services/team.service';
import { Team } from '../../common/interfaces/team';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { TeamDialogueComponent } from './team-dialogue/team-dialogue.component';
import { User } from '../../common/interfaces/user';
@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
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
    MatDividerModule
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class TeamComponent {
  displayedColumns: string[] = ['position', 'name','teamLead', 'teamMembers'];

  public users: User[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  constructor(public settingsService: SettingsService,
              public dialog: MatDialog,
              public teamService: TeamService){
    this.settings = this.settingsService.settings;
  }
  dataSource : Team[]=[]
  ngOnInit() {
    this.getTeams();
    console.log("usersssssssssssssssssssssssssssss")
    this.teamService.getTeam().subscribe((res)=>{
      this.dataSource = res;
      console.log('team res: ' , res);

 })
  }

  public getTeams(): void {
    this.users = null; //for show spinner each time
    this.teamService.getTeam().subscribe((users: any) =>{
      console.log(users);

      this.users = users
    });
  }
  applyFilter(filterValue: string) {
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  public addTeam(user:User){
    this.teamService.addTeam(user).subscribe(user => this.getTeams());
  }
  // public updateUser(user:User){
  //   this.usersService.updateUser(user).subscribe(user => this.getUsers());
  // }
  // public deleteUser(user:User){
  //   this.usersService.deleteUser(user.id).subscribe(user => this.getUsers());
  // }


  public onPageChanged(event: any){
    this.page = event;
    // this.getTeam();
    if(this.settings.fixedHeader){
        document.getElementById('main-content')!.scrollTop = 0;
    }
    else{
        document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
    }
  }

  public openUserDialog(user: any){
    let dialogRef = this.dialog.open(TeamDialogueComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      // if(user){
      //     (user.id) ? this.updateUser(user) : this.addUser(user);
      // }
    });
  }

}


