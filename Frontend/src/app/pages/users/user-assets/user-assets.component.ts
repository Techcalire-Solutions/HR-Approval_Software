/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { AssetReturnComponent } from './asset-return/asset-return.component';
import { AssetsService } from '@services/assets.service';
import { Assets } from '../../../common/interfaces/assets/assets';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY', // Change to desired format
  },
  display: {
    dateInput: 'DD/MM/YYYY', // Display format for the input field
    monthYearLabel: 'MMM YYYY', // Format for month/year in the header
    dateA11yLabel: 'DD/MM/YYYY', // Accessibility format for dates
    monthYearA11yLabel: 'MMMM YYYY', // Accessibility format for month/year
  },
};


@Component({
  selector: 'app-user-assets',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatFormFieldModule, MatInputModule, CommonModule, MatDatepickerModule,
    MatNativeDateModule, MatAutocompleteModule
  ],
  templateUrl: './user-assets.component.html',
  styleUrl: './user-assets.component.scss',

  providers: [provideMomentDateAdapter(MY_FORMATS)]
})
export class UserAssetsComponent implements OnDestroy{
  dialogRef = inject(MatDialogRef<UserAssetsComponent>, { optional: true })
  assetData = inject(MAT_DIALOG_DATA, { optional: true });
  ngOnDestroy(): void {
    this.userAssetSub?.unsubscribe();
    this.assetSub?.unsubscribe();
    this.userSub?.unsubscribe();
    this.userPosition?.unsubscribe();
  }

  rows: any[] = [];
  private fb = inject(FormBuilder);
  form = this.fb.group({
    assetCode: [''],
    newRow: this.fb.group({
      assetId: <any>[],
      assetName: [''],
      identifierType: [''],
      identificationNumber: [''],
      description: [''],
      assignedDate: [],
      status: [true]
    }),
  });

  private route = inject(ActivatedRoute);
  ngOnInit(): void {
    let id = this.route.snapshot.params['id'];
    if(!id){
      id = this.assetData.id
    }
    this.getUserById(id)
    this.getAssets()
    let assetNameChanged = false;

    this.form.get(['newRow', 'assetName'])?.valueChanges.subscribe(() => {
      assetNameChanged = true;
    });
  
    // Monitor value changes for the specified fields
    const fieldsToWatch = ['identifierType', 'identificationNumber', 'description'];
    
    fieldsToWatch.forEach((field, index) => {
      this.form.get(['newRow', field])?.valueChanges.subscribe((newValue) => {
        if (newValue !== null && newValue !== '' && !assetNameChanged) {
          this.isInvalidAsset = true; 
        }
        if (index === fieldsToWatch.length - 1) {
          assetNameChanged = false;
        }
      });
    });
  }

  private companyAssetSub!: Subscription;
  private readonly assetService = inject(AssetsService);
  assets : Assets [] = [];
  getAssets(){
    this.companyAssetSub = this.assetService.getAssets().subscribe(asset => {
      this.assets = asset;
      this.filteredOptions = this.assets
    })
  }

  patch(selectedAsset: Assets) {
    this.form.patchValue({
      newRow: {
        assetId: selectedAsset.id,
        assetName: selectedAsset.assetName,
        identifierType: selectedAsset.identifierType,
        identificationNumber: selectedAsset.identificationNumber,
        description: selectedAsset.description
      }
    });
  }

  filterValue: string;
  filteredOptions: Assets[] = [];
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredOptions = this.assets.filter(option =>
      option.assetName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.identificationNumber.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
    this.form.patchValue({
      newRow: {
        assetId: null,
        identifierType: '',
        identificationNumber: '',
        description: ''
      }
    });
  }

  isInvalidAsset: boolean = false;
  validateInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    const match = this.filteredOptions.some(
      option => option.assetName.toLowerCase() === value.toLowerCase()
    );
    this.isInvalidAsset = !match;
  }

  private snackbar = inject(MatSnackBar);
  updateStatus: boolean = false;
  id: number;
  userName: string;
  private userSub!: Subscription;
  userPosition: Subscription;
  getUserById(id: number){
    this.userSub = this.userService.getUserAssetsByUser(id).subscribe(data =>{
      if(data){
        this.userName = data.user.name
        this.updateStatus = true;
        this.id = data.id;
        this.assetCode = data.assetCode;
        for(const element of data.userAssetsDetails){
          this.addRow(element)
        }
      }else{
        this.userPosition = this.userService.getUserPositionDetailsByUser(id).subscribe(position=>{
          if(position=== null || !position.department){
            alert("Add department details...");
            if(this.dialogRef) this.dialogRef.close();
            else history.back();
          }
          this.userName = position.user.name
          this.generateCode(position?.department)
        });
      }
    });

  }

  editRow(row: any, index: number): void {
    this.form.get('newRow')?.patchValue({
      assetId: row.assetId,
      assetName: row.assetName,
      identifierType: row.identifierType,
      identificationNumber: row.identificationNumber,
      description: row.description,
      assignedDate: row.assignedDate,
      status: row.status
    });
    this.rows.splice(index, 1);
  }

  submit: Subscription;
  addRow(data?: any) {
    if(!this.isInvalidAsset){
      let newRow;
      if(data){
         newRow = {
          assetId: data.assetId,
          assetName: data.asset.assetName,
          identifierType: data.asset.identifierType,
          identificationNumber: data.asset.identificationNumber,
          description: data.asset.description,
          assignedDate: data.assignedDate,
          status: data.status
         }
      }
      if (this.form.valid)  newRow = { ...this.form.value.newRow, status: true };
      this.rows.push(newRow);
      
      this.form.reset();
    }else{
      const data = {
        assetName: this.form.getRawValue().newRow.assetName,
        description: this.form.getRawValue().newRow.description,
        identifierType: this.form.getRawValue().newRow.identifierType,
        identificationNumber: this.form.getRawValue().newRow.identificationNumber,
        assignedDate: this.form.getRawValue().newRow.assignedDate,
      }
      this.submit = this.assetService.addAssets(data).subscribe((res: any)=>{
        this.snackbar.open("Asset added succesfully...","" ,{duration:3000})
        let newRow;
        if(data) { 
          newRow = {
            ...data, 
            assetId: res.id,
            status: true
          }
        }
        this.rows.push(newRow);
        this.form.reset();
        this.getAssets();
      })
    }
  }

  assetSub!: Subscription;
  saveAssets() {
    const data = {
      userId: this.route.snapshot.params['id']?this.route.snapshot.params['id']:this.assetData.id,
      assetCode: this.assetCode,
      assets: this.rows
    }
    if(this.updateStatus){
      this.assetSub = this.userService.updateUserAssets(data, this.id).subscribe(() => {
        this.getAssets();
        this.dialogRef?.close();
        this.snackbar.open("Assets updated successfully...","" ,{duration:3000})
      })
    }else{
      this.assetSub = this.userService.addUserAssets(data).subscribe(() => {
        this.getAssets();
        this.updateStatus = true;
        this.dialogRef?.close();
        this.snackbar.open("Assets saved successfully...","" ,{duration:3000})
      })
    }

  }

  removeRow(index: number) {
    this.rows.splice(index, 1); // Remove the row at the specified index
  }

  private userService = inject(UsersService);
  public assetCode: string;
  userAssetSub!: Subscription;
  generateCode(department?: string) {
    let prefix: string;
    const currentYear = new Date().getFullYear();
    const twoDigitYear = currentYear.toString().slice(-2);

    this.userAssetSub = this.userService.getUserAssets(department).subscribe((res) => {
      const users = res;

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

        const departmentAbbreviations: { [key: string]: string } = {
          Finance: "FIN",
          Sales: "SAL",
          Marketing: "MKT",
          Designing: "DES",
          Logistics: "LOG",
          Operation: "OPS",
          HR: "HR",
          IT: "IT"
      };

      const departmentAbbr = department 
      ? departmentAbbreviations[department] || department 
      : "GEN";

        prefix = `OAC-${twoDigitYear}-${departmentAbbr}-`;
        
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

  private dialog = inject(MatDialog);
  returnAsset(i: number): void {
    const dialogRef = this.dialog.open(AssetReturnComponent, {});
  
    dialogRef.afterClosed().subscribe((res) => {
      if (res.confirmed) {
        this.rows[i].status = false;
        this.rows[i].note = res.data.note;
        this.rows[i].returnDate = res.data.returnDate;
        const data = {
          userId: this.route.snapshot.params['id'],
          assetCode: this.assetCode,
          assets: this.rows,
        };
        
        this.assetSub = this.userService.updateUserAssets(data, this.id).subscribe(() => {
          this.snackbar.open("Assets updated successfully...","" ,{duration:3000})
        })
      }
    });
  }
  

}
