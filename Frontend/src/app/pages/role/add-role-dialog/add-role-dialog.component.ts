import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { UserDialogComponent } from '../../users/user-dialog/user-dialog.component';
import { User } from '../../../common/models/user.model';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { RoleService } from '@services/role.service';

@Component({
  selector: 'app-add-role-dialog',
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
  templateUrl: './add-role-dialog.component.html',
  styleUrl: './add-role-dialog.component.scss'
})
export class AddRoleDialogComponent {
  public form: FormGroup;
  public passwordHide:boolean = true;
  constructor(public dialogRef: MatDialogRef<UserDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public user: User,
              public fb: FormBuilder,private roleService:RoleService) {
    this.form = this.fb.group({
 
      roleName: [null, Validators.compose([Validators.required, Validators.minLength(2)])],
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
