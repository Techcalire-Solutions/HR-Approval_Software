import { Component, inject, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { UserDialogComponent } from '../../users/user-dialog/user-dialog.component';
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
import {MatToolbarModule} from '@angular/material/toolbar';
import { User } from '../../../common/interfaces/user';
import { Role } from '../../../common/interfaces/role';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    DatePipe,
    MatToolbarModule,
  ],
  templateUrl: './add-role-dialog.component.html',
  styleUrl: './add-role-dialog.component.scss'
})
export class AddRoleDialogComponent {
  public form: FormGroup;
  public passwordHide:boolean = true;
  snackBar = inject(MatSnackBar);

  constructor(public dialogRef: MatDialogRef<AddRoleDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public role: any,
              public fb: FormBuilder,private roleService:RoleService) {
    this.form = this.fb.group({

      roleName: ['', Validators.required],
      abbreviation: ['', Validators.required],
      status: [true]

    });
  }

  ngOnInit() {
    if (this.role) {
      console.log(this.role);
      if(this.role.type === 'add'){
        this.form.patchValue({roleName: this.role.name})
      }else this.patchRole(this.role);
    }
  }

  editStatus: boolean = false;
  patchRole(role: any){
    this.editStatus = true;
    this.form.patchValue({
      roleName: role.roleName,
      abbreviation: role.abbreviation
    })
  }


  close(): void {
    this.dialogRef.close();
  }
  onSubmit(){
    console.log(this.role);
    
    if(this.editStatus){
      this.roleService.updateRole(this.role.id, this.form.getRawValue()).subscribe(data => {
        this.dialogRef.close()
        this.snackBar.open("Role updated succesfully...","" ,{duration:3000})
      });
    }else{
      this.roleService.addRole(this.form.getRawValue()).subscribe((res)=>{
        console.log(res);
        
        this.dialogRef.close();
        this.snackBar.open("Role added succesfully...","" ,{duration:3000})
      })
    }
  }
  SubmitForm(){

  }


}
