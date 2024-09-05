import { Component, Inject } from '@angular/core';
import { Team } from '../../../common/interfaces/team';
import { TeamService } from '@services/team.service';
import { User } from '../../../common/models/user.model';
import { UsersService } from '@services/users.service';

import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamComponent } from '../team.component';


import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { RoleService } from '../../../services/role.service';
import { MaterialModule } from '../../../common/material/material.module';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';

 // Needed for mat-form-field
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-team-dialogue',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FlexLayoutModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    DatePipe,
    MaterialModule,
    MatToolbarModule,
    MatCardModule,
    MatSelectModule
  ],
  templateUrl: './team-dialogue.component.html',
  styleUrl: './team-dialogue.component.scss'
})
export class TeamDialogueComponent {
  constructor(public dialog: MatDialog, private _snackbar: MatSnackBar, private teamService: TeamService, private fb: FormBuilder, public dialogRef: MatDialogRef<TeamComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, private userService: UsersService) { }
  teamForm = this.fb.group({
    teamName: ['', Validators.required],
    userId: ['', Validators.required],
   //  teamMembers: ['', Validators.required]
   teamMembers: [[]] // Initialize as an empty array
  });


  ngOnInit(): void {
    this.getTeams()
    this.getUsers()
  }
  teams: Team[] = []
  getTeams() {
    this.teamService.getTeam().subscribe((res) => {
      this.teams = res;
    })
  }
  onSubmit() {
    let teamMem: any = this.teamForm.getRawValue();
    console.log(teamMem);

    let teamM = [];
    for(let i = 0; i< teamMem.teamMembers.length; i++) {
     teamM[i] = {
         userId : teamMem.teamMembers[i]
       }
     }
       // / Add teamMem.userId as a member
   // teamM.push({
   //   userId: teamMem.userId
   // });
     let  data = {
       teamName: teamMem.teamName,
       userId: teamMem.userId,
       teamMembers: teamM
     }

    console.log(data)
    this.teamService.addTeam(data).subscribe((res) => {
      console.log(res)
      this._snackbar.open("Team added successfully...", "", { duration: 3000 })
      this.clearControls()
    }, (error => {
      console.log(error)
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
//   editFunction(id: any) {
//    this.isEdit = true;
//    this.teamId = id;
//    console.log(this.teamId);
//    this.teamService.getTeamById(this.teamId).subscribe((res) => {
//      let app$ = res;
//      console.log(app$);
//      console.log(app$.teamMembers)
//      let members : any = app$.teamMembers

//      let teamName = app$.teamName;
//      let lead: any = app$.userId;
//      let teamMembers : any = members.map((x:any)=>x.userId)



//      this.teamForm.patchValue({
//        teamName: teamName,
//        userId: lead,
//        teamMembers : teamMembers

//      });
//    });
//  }



  edit() {



    // this.isEdit = true
    // let data = {
    //   teamName: this.teamForm.get('teamName')?.value,


    // }
    // console.log(data)
    // console.log(this.teamId)
    // this.companyService.updateTeam(this.teamId, data).subscribe((res) => {
    //   this._snackbar.open("Team updated successfully...", "", { duration: 3000 })
    //   this.clearControls()

    //   console.log(res)
    // })



  }
  // deleteFunction(id: number) {
  //   const dialogRef = this.dialog.open(DeleteComponent, {
  //     width: '450px',
  //     data: {}
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result === true) {

  //       this.companyService.deleteTeam(id).subscribe((res) => {
  //         this._snackbar.open("Team deleted successfully...", "", { duration: 3000 })
  //         this.getTeams()
  //       }, (error => {
  //         console.log(error)
  //         this._snackbar.open(error.error.message, "", { duration: 3000 })
  //       }))
  //     }
  //   });


  // }

  manageUser() {
  //  const dialogRef = this.dialog.open(UserManagementComponent, {
  //    height: "800px",
  //    width: "1200px",
  //  });
  //  dialogRef.afterClosed().subscribe((result) => {

  //  });
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
