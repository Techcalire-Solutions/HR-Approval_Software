import { Component, Inject, OnInit } from '@angular/core';
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
import { RoleService } from '@services/role.service';

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
    DatePipe
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss'
})
export class UserDialogComponent implements OnInit {
  public form: FormGroup;
  public passwordHide:boolean = true;
  constructor(public dialogRef: MatDialogRef<UserDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public user: User,
              public fb: FormBuilder,private roleService:RoleService) {
    this.form = this.fb.group({
 
      roleName: [null, Validators.compose([Validators.required, Validators.minLength(5)])],
      abbreviation: [null, Validators.compose([Validators.required, Validators.minLength(2)])],

    });
  }

  ngOnInit() {

  }

  close(): void {
    this.dialogRef.close();
  }
  onSubmit(){
   
    console.log(this.form.getRawValue());
    this.roleService.addRole(this.form.getRawValue()).subscribe((res)=>{
      this.dialogRef.close();
    })
   
  }
  SubmitForm(){

  }


}
