import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { RoleService } from '@services/role.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

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
    MatDialogModule,
    MatButtonModule,
    MatOptionModule,
    MatSelectModule,
  ],
  templateUrl: './add-role-dialog.component.html',
  styleUrl: './add-role-dialog.component.scss'
})
export class AddRoleDialogComponent {
  snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<AddRoleDialogComponent>)
  role = inject(MAT_DIALOG_DATA);
  fb = inject(FormBuilder);
  roleService = inject(RoleService)

  form = this.fb.group({
    department: [''],
    roleName: ['', Validators.required],
    abbreviation: ['', Validators.required],
    status: [true]
  });

  ngOnInit() {
    if (this.role) {
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
      abbreviation: role.abbreviation,
      department: role.department
    })
  }


  close(): void {
    this.dialogRef.close();
  }
  onSubmit(){
    if(this.editStatus){
      this.roleService.updateDesignation(this.role.id, this.form.getRawValue()).subscribe(data => {
        this.dialogRef.close()
        this.snackBar.open("Role updated succesfully...","" ,{duration:3000})
      });
    }else{
      this.roleService.addDesignation(this.form.getRawValue()).subscribe((res)=>{
        this.dialogRef.close();
        this.snackBar.open("Role added succesfully...","" ,{duration:3000})
      })
    }
  }
}
