import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
    let id = this.route.snapshot.params['id'];
    this.getUserById(id)
  }

  private snackbar = inject(MatSnackBar);
  getUserById(id: number){
    this.userService.getUserPositionDetailsByUser(id).subscribe(position=>{
      console.log(position);
      this.generateCode(position?.department)
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
    
  }

  // Function to remove a row
  removeRow(index: number) {
    this.rows.splice(index, 1); // Remove the row at the specified index
  }

  private userService = inject(UsersService);
  generateCode(department?: string) {
    let prefix: any;
    const currentYear = new Date().getFullYear();
    const twoDigitYear = currentYear.toString().slice(-2);
    console.log(twoDigitYear)

    this.userService.getUserAssets(department).subscribe((res) => {
      console.log(res);
      
      let users = res;

      if (users.length > 0) {
        const maxId = users.reduce((prevMax, inv) => {
          const empNoParts = inv.empNo.split('-'); // Split by '-'

          // Extract the numeric portion that represents the ID, assuming it's the last part
          const idNumber = parseInt(empNoParts[empNoParts.length - 1], 10);

          prefix = this.extractLetters(inv.empNo); // Get the prefix

          if (!isNaN(idNumber)) {
            // Compare and return the maximum ID
            return idNumber > prevMax ? idNumber : prevMax;
          } else {
            return prevMax;
          }
        }, 0);

        // Increment the maxId by 1 to get the next ID
        let nextId = maxId + 1;

        const paddedId = `${prefix}-${currentYear}-${nextId.toString().padStart(3, "0")}`;

        let ivNum = paddedId;
        // this.invNo = ivNum;
        // this.form.get('empNo')?.setValue(ivNum);
      } else {
        // If there are no employees in the array, set the employeeId to 'EMP001'
        let nextId = 0o1;
        prefix =  `OAC-${currentYear}-`;

        const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;

        let ivNum = paddedId;

        // this.form.get('envNo')?.setValue(ivNum);
        // this.invNo = ivNum;
      }
    });
  }

  extractLetters(input: string): string {
    const match = input.match(/^[A-Za-z]+/);

    return match ? match[0] : '';
  }

}