import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RoleService } from '@services/role.service';
import { Subscription } from 'rxjs';
import { Designation } from '../../../common/interfaces/users/designation';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddDesignationComponent } from '../designation/add-designation/add-designation.component';
import { MatInputModule } from '@angular/material/input';
import { UsersService } from '@services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-update-designation',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, MatAutocompleteModule, MatIconModule, MatInputModule, ReactiveFormsModule,
    MatToolbarModule
  ],
  templateUrl: './update-designation.component.html',
  styleUrl: './update-designation.component.scss'
})
export class UpdateDesignationComponent implements OnInit, OnDestroy{
  private dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  name: string;
  empNo: string;
  ngOnInit(): void {
    this.getDesignation();
    this.name = this.dialogData.name;
    this.empNo = this.dialogData.empNo;
    this.getUsrPos();
  }

  getUsrPos(){
    this.userService.getUserPositionDetailsByUser(this.dialogData.id).subscribe(user => {
      this.form.get('designationName')?.setValue(user.designation.designationName);
      this.form.get('designationId')?.setValue(user.designationId);
    });
  }

  private fb = inject(FormBuilder);
  form = this.fb.group({
    designationName: [''],
    designationId: <any>[],
  });

  desigSub!: Subscription;
  roleService = inject(RoleService);
  designation: Designation[] = [];
  filteredOptions: Designation[] = [];
  getDesignation(){
    this.desigSub = this.roleService.getDesignation().subscribe(designation =>{
      this.designation = designation;
      this.filteredOptions = designation;
    });
  }

  filterValue: string;
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredOptions = this.designation.filter(option =>
      option.designationName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.abbreviation.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
  }

  patch(selectedSuggestion: Designation) {
    this.form.get('designationName')?.setValue(selectedSuggestion.designationName);
    this.form.get('designationId')?.setValue(selectedSuggestion.id);
  }

  private dialog = inject(MatDialog);
  add(){
    const name = this.filterValue;
    const dialogRef = this.dialog.open(AddDesignationComponent, {
      data: {type : 'add', name: name}
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getDesignation()
    })
  }

  private userService = inject(UsersService);
  submit!: Subscription;
  private snackBar = inject(MatSnackBar);
  onSubmit(){
    this.submit = this.userService.updateDesignation(this.dialogData.id, this.form.getRawValue()).subscribe(data => {
      this.dialogRef.close();
      this.snackBar.open(`Designation updated for ${this.name}-${this.empNo}...`, '', { duration: 3000 });
    });
  }

  ngOnDestroy(): void {
    this.desigSub?.unsubscribe();
    this.submit?.unsubscribe();
  }

  dialogRef = inject(MatDialogRef<UpdateDesignationComponent>)
  close(){
    this.dialogRef.close();
  }

}
