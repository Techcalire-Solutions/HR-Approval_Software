/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';

@Component({
  selector: 'app-user-assets',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
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
  getUserById(id: number){
    this.userService.getUserPositionDetailsByUser(id).subscribe(position=>{
      console.log(position);
      if(position === null){
        alert("Add department details...");
        history.back();
      }
      this.generateCode(position?.department.abbreviation)
    });
  }

  // Function to add a new row
  addRow() {
    if (this.form.valid) {
      const newRow = { ...this.form.value.newRow };
      this.rows.push(newRow);
      this.form.reset(); 
    }
  }

  // Function to save user assets
  saveAssets() {
    console.log(this.rows);
    const data = {
      userId: this.route.snapshot.params['id'],
      assetCode: this.assetCode,
      assets: this.rows
    }
    this.userService.addUserAssets(data).subscribe(asset => {
      console.log(asset);
      
      this.snackbar.open("Assets saved successfully...","" ,{duration:3000})
    })
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