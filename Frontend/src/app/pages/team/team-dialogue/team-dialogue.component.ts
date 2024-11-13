import { Component, Inject } from '@angular/core';
import { TeamService } from '@services/team.service';
import { UsersService } from '@services/users.service';

import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamComponent } from '../team.component';


import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { DatePipe } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
 // Needed for mat-form-field
import { MatSelectModule } from '@angular/material/select';
import { Team } from '../../../common/interfaces/users/team';
import { User } from '../../../common/interfaces/users/user';

@Component({
  selector: 'app-team-dialogue',
  standalone: true,
  imports: [ ReactiveFormsModule,  FlexLayoutModule, MatTabsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDatepickerModule,
    MatNativeDateModule,  MatRadioModule, MatDialogModule, MatButtonModule, MatCheckboxModule, DatePipe, MatToolbarModule, MatCardModule,
    MatSelectModule, CommonModule
  ],
  templateUrl: './team-dialogue.component.html',
  styleUrl: './team-dialogue.component.scss'
})
export class TeamDialogueComponent {
  constructor(public dialog: MatDialog, private _snackbar: MatSnackBar, private teamService: TeamService, private fb: FormBuilder, public dialogRef: MatDialogRef<TeamComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, @Inject(MAT_DIALOG_DATA) public team: Team, private userService: UsersService) { }
  teamForm = this.fb.group({
    teamName: ['', Validators.required],
    userId: ['', Validators.required],

   teamMembers: [[]]
  });


  ngOnInit(): void {
    this.getTeams()
    this.getUsers()
    if (this.team) {
      this.patchTeam(this.team);
    }
  }
  patchTeam(team: any) {
    this.teamForm.patchValue({
      teamName: team.teamName,
      userId: team.userId
    });

    const teamMembersArray = team.teamMembers.map((member: any) => member.userId);
    this.teamForm.patchValue({
      teamMembers: teamMembersArray
    });
  }

  edit(id: any) {
    this.isEdit = true;
    const teamMem: any = this.teamForm.getRawValue();

    let teamM = [];
    for (let i = 0; i < teamMem.teamMembers.length; i++) {
      teamM[i] = {
        userId: teamMem.teamMembers[i]
      };
    }

    const updatedTeamData = {
      teamName: teamMem.teamName,
      userId: teamMem.userId,
      teamMembers: teamM
    };
    this.teamId = id;
    this.teamService.updateTeam(this.teamId, updatedTeamData).subscribe((res) => {
      this._snackbar.open("Team updated successfully...", "", { duration: 3000 });
      this.clearControls();
    }, (error) => {
      alert(error);
    });
  }


  teams: Team[] = []
  getTeams() {
    this.teamService.getTeam().subscribe((res) => {
      this.teams = res;
    })
  }
  onSubmit() {
    let teamMem: any = this.teamForm.getRawValue();
    let teamM = [];
    for(let i = 0; i< teamMem.teamMembers.length; i++) {
     teamM[i] = {
         userId : teamMem.teamMembers[i]
       }
     }

     let  data = {
       teamName: teamMem.teamName,
       userId: teamMem.userId,
       teamMembers: teamM
     }
    this.teamService.addTeam(data).subscribe((res) => {
      this.dialogRef.close();
      this._snackbar.open("Team added successfully...", "", { duration: 3000 })
      this.clearControls()
    }, (error => {
      alert(error)
    }))
  }

  clearControls() {
    this.teamForm.reset()
    this.teamForm.setErrors(null)
    //Object.keys(this.teamForm.controls).forEach(key=>{this.teamForm.get(key).setErrors(null)})
    this.getTeams()
  }


  onCancelClick(): void {
    this.dialogRef.close();
  }
  teamMembers!:any// Initialize as null or another appropriate initial value


  isEdit = false;
  teamId: any | undefined;

  manageUser() {

 }
  users: User[] = [];
 getUsers() {
   this.userService.getUser().subscribe((result) => {
     this.users = result;
   })
 }

  clear() {
    this.teamForm.reset()

  }

 }
