/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Settings, SettingsService } from '../../services/settings.service';

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
import { MatTableModule } from '@angular/material/table';
import { TeamService } from '@services/team.service';
import { TeamDialogueComponent } from './team-dialogue/team-dialogue.component';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Team } from '../../common/interfaces/users/team';
import { User } from '../../common/interfaces/users/user';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
@Component({
  selector: 'app-team',
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
    MatPaginatorModule,
    MatDividerModule
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class TeamComponent {
  displayedColumns: string[] = ['position', 'name', 'teamLead', 'teamMembers', 'action'];


  public teams: Team[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  constructor( private _snackbar: MatSnackBar,public settingsService: SettingsService,
              public dialog: MatDialog,
              public teamService: TeamService){
    this.settings = this.settingsService.settings;
  }
  dataSource : Team[]=[]
  ngOnInit() {
    this.getTeams();
    this.teamService.getTeam().subscribe((res)=>{
      this.dataSource = res;
    })
  }

  public getTeams(): void {
    this.teams = null; //for show spinner each time
    this.teamService.getTeam().subscribe((teams: any) =>{
      console.log(teams);
      this.teams = teams
    });
  }
  applyFilter() {
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  public addTeam(user:User){
    this.teamService.addTeam(user).subscribe(() => this.getTeams());
  }
  // public updateUser(user:User){
  //   this.usersService.updateUser(user).subscribe(user => this.getUsers());
  // }
  // public deleteUser(user:User){
  //   this.usersService.deleteUser(user.id).subscribe(user => this.getUsers());
  // }
  public openRoleDialog(user: any){
    const dialogRef = this.dialog.open(TeamDialogueComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getTeams()
    });
  }

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
    const dialogRef = this.dialog.open(TeamDialogueComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(() => {
      // if(user){
      //     (user.id) ? this.updateUser(user) : this.addUser(user);
      // }
    });
  }

  delete!: Subscription;
  deleteTeam(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.teamService.deleteTeam(id).subscribe(() => {
          this._snackbar.open("Team deleted successfully...","" ,{duration:3000})
          this.getTeams()
        });
      }
    });
  }

}


