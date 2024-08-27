import { Component, Inject, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User, UserContacts, UserProfile, UserSettings, UserSocial, UserWork } from '../../../common/models/user.model';
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
import { Role } from '../../../common/interfaces/role';
import { UsersService } from '../../../services/users.service';


@Component({
  selector: 'app-user-dialog',
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
    MatToolbarModule
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
  public form: FormGroup;
  public passwordHide:boolean = true;
  constructor(public dialogRef: MatDialogRef<UserDialogComponent>,
         
              public fb: FormBuilder,private roleService:RoleService,private userService:UsersService) {
    this.form = this.fb.group({
 
  
        name: [
          null, 
          Validators.compose([Validators.required, Validators.minLength(5)])
        ],
        email: [
          null, 
          Validators.compose([Validators.required, Validators.email])
        ],
        phoneNumber: [
          null, 
          Validators.compose([Validators.required, Validators.pattern(/^\d{10}$/)])
        ],
        password: [
          null, 
          Validators.compose([Validators.required, Validators.minLength(8)])
        ],
        roleId: [
          null, 
          Validators.compose([Validators.required])
        ]
      })
      


  }

  ngOnInit() {
    this.getRoles()
    this.getUsers()

  }
  hidePassword: boolean = true;
  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }
  roles:Role[]=[]
  getRoles(){
    this.roleService.getRole().subscribe((res)=>{
      this.roles = res;
    })
    
  }
  getUsers(){
   this.userService.getUser().subscribe((res)=>{
    console.log(res)
   })
  }

  close(): void {
    this.dialogRef.close();
  }
  onSubmit(){
   
    console.log(this.form.getRawValue());
    this.userService.addUser(this.form.getRawValue()).subscribe((res)=>{
      console.log(res)
      this.getUsers();
      this.dialogRef.close();
     
    
    })
   
  }
  
  SubmitForm(){

  }


}
