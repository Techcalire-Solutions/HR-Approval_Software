/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';

@Component({
  selector: 'app-user-assets',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatFormFieldModule, MatInputModule, CommonModule],
  templateUrl: './user-assets.component.html',
  styleUrl: './user-assets.component.scss'
})
export class UserAssetsComponent {
  rows: any[] = []; 

  private fb = inject(FormBuilder);
  form = this.fb.group({
    assetCode: [''],
    newRow: this.fb.group({
      identifierType: [''],
      identificationNumber: [''],
      description: [''],
      assignedDate: [''],
    }),
  });

  private route = inject(ActivatedRoute);
  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.getUserById(id)
  }

  private snackbar = inject(MatSnackBar);
  updateStatus: boolean = false;
  id: number;
  getUserById(id: number){
    this.userService.getUserAssetsByUser(id).subscribe(data =>{
      if(data){
        this.updateStatus = true;
        this.id = data.id;
        this.assetCode = data.assetCode;
        for(let i = 0; i < data.assets.length; i++){
          this.addRow(data.assets[i])
        }
      }else{
        this.userService.getUserPositionDetailsByUser(id).subscribe(position=>{
          if(position === null){
            alert("Add department details...");
            history.back();
          }
          this.generateCode(position?.department.abbreviation)
        });
      }
    });

  }

  editRow(row: any, index: number): void {
    this.form.get('newRow')?.patchValue({
      identifierType: row.identifierType,
      identificationNumber: row.identificationNumber,
      description: row.description,
      assignedDate: row.assignedDate,
    });
    this.rows.splice(index, 1);
  }

  addRow(data?: any) {
    let newRow;
    if(data) newRow = data
    if (this.form.valid)  newRow = { ...this.form.value.newRow }; 
    this.rows.push(newRow);
    this.form.reset();
  }

  // Function to save user assets
  saveAssets() {
    const data = {
      userId: this.route.snapshot.params['id'],
      assetCode: this.assetCode,
      assets: this.rows
    }
    if(this.updateStatus){
      this.userService.updateUserAssets(data, this.id).subscribe(() => {
        this.snackbar.open("Assets updated successfully...","" ,{duration:3000})
      })
    }else{
      this.userService.addUserAssets(data).subscribe(() => {
        this.snackbar.open("Assets saved successfully...","" ,{duration:3000})
      })
    }

  }

  // Function to remove a row
  removeRow(index: number) {
    this.rows.splice(index, 1); // Remove the row at the specified index
  }

  private userService = inject(UsersService);
  assetCode: string;
  generateCode(department?: string) {
    let prefix: string;
    const currentYear = new Date().getFullYear();
    const twoDigitYear = currentYear.toString().slice(-2);

    this.userService.getUserAssets(department).subscribe((res) => {
      const users = res;
      console.log(users);
      
      if (users.length > 0) {
        const maxId = users.reduce((prevMax, inv) => {
          const empNoParts = inv.assetCode.split('-'); // Split by '-'

          const idNumber = parseInt(empNoParts[empNoParts.length - 1], 10);

          prefix = this.extractLetters(inv.assetCode); // Get the prefix

          if (!isNaN(idNumber)) {
            // Compare and return the maximum ID
            return idNumber > prevMax ? idNumber : prevMax;
          } else {
            return prevMax;
          }
        }, 0);

        const nextId = maxId + 1;

        const paddedId = `${prefix}-${twoDigitYear}-${department}-${nextId.toString().padStart(3, "0")}`;

        const ivNum = paddedId;
        this.assetCode = ivNum;
        this.form.get('assetCode')?.setValue(ivNum);
      } else {
        const nextId = 0o1;
        prefix =  `OAC-${twoDigitYear}-${department}-`;

        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        const ivNum = paddedId;

        this.form.get('assetCode')?.setValue(ivNum);
        this.assetCode = ivNum;
      }
    });
  }

  extractLetters(input: string): string {
    const match = input.match(/^[A-Za-z]+/);

    return match ? match[0] : '';
  }

}