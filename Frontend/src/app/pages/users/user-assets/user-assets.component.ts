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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { AddUserAssetsComponent } from '../../assets/add-user-assets/add-user-assets.component';

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
      serialNumber: [''],
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
    // let assetNameChanged = false;

    // this.form.get(['newRow', 'assetName'])?.valueChanges.subscribe(() => {
    //   assetNameChanged = true;
    // });
  
    // Monitor value changes for the specified fields
    // const fieldsToWatch = ['identifierType', 'identificationNumber', 'description'];
    
    // fieldsToWatch.forEach((field, index) => {
    //   this.form.get(['newRow', field])?.valueChanges.subscribe((newValue) => {
    //     if (newValue !== null && newValue !== '' && !assetNameChanged) {
    //       this.isInvalidAsset = true; 
    //     }
    //     if (index === fieldsToWatch.length - 1) {
    //       assetNameChanged = false;
    //     }
    //   });
    // });
  }

  private companyAssetSub!: Subscription;
  private readonly assetService = inject(AssetsService);
  assets : Assets [] = [];
  getAssets(){
    this.companyAssetSub = this.assetService.getUserAssets().subscribe(asset => {
      this.assets = asset;
      this.filteredOptions = this.assets
    })
  }

  patch(selectedAsset: Assets) {
    console.log(selectedAsset);
    
    this.form.patchValue({
      newRow: {
        assetId: selectedAsset.id,
        assetName: selectedAsset.assetName,
        serialNumber: selectedAsset.serialNumber
      }
    });
  }

  filterValue: string;
  filteredOptions: Assets[] = [];
  inputValue: string = '';
  showAddOption: any = false;
  search(event: Event) {
    this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
    this.filteredOptions = this.assets.filter(option =>
      option.assetName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
      option.serialNumber.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
    );
    this.form.patchValue({
      newRow: {
        assetId: null,
        serialNumber: ''
      }
    });
  
  // Show "Add new" option if no matches and input is not empty
  this.showAddOption = this.filterValue && this.filteredOptions.length === 0;
  }

  addNewIfNoMatch() {
    const dialogRef = this.dialog.open(AddUserAssetsComponent, {
      data: { initialName: this.filterValue }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.getAssets()
      }
    });
  }

onOptionSelected(event: MatAutocompleteSelectedEvent) {
  // Your existing selection logic
  const selectedValue = event.option.value;
  // ... handle the selection
}
  // search(event: Event) {
  //   this.filterValue = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
  //   this.filteredOptions = this.assets.filter(option =>
  //     option.assetName.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)||
  //     option.serialNumber.replace(/\s+/g, '').toLowerCase().includes(this.filterValue)
  //   );
  //   this.form.patchValue({
  //     newRow: {
  //       assetId: null,
  //       identifierType: '',
  //       identificationNumber: '',
  //       description: ''
  //     }
  //   });
  // }

  // isInvalidAsset: boolean = false;
  // validateInput(event: Event): void {
  //   const value = (event.target as HTMLInputElement).value.trim().replace(/\s+/g, '').toLowerCase();
  //   const match = this.filteredOptions.some(
  //     option => option.assetName.toLowerCase() === value.toLowerCase()
  //   );
  //   this.isInvalidAsset = !match;
  // }

  private snackbar = inject(MatSnackBar);
  updateStatus: boolean = false;
  id: number;
  userName: string;
  private userSub!: Subscription;
  userPosition: Subscription;
  getUserById(id: number){
    while(this.rows.length > 0) {
      this.removeRow(0); // Always remove the first item until none remain
    }
    this.id = id;
    this.userSub = this.assetService.getUserAssetsByUser(id).subscribe(data =>{
      if(data){
        this.updateStatus = true;
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
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
          // this.generateCode(position?.department)
        });
      }
    });
  }

  editRow(row: any, index: number): void {
    this.form.get('newRow')?.patchValue({
      assetId: row.assetId,
      assetName: row.assetName,
      serialNumber: row.serialNumber,
      assignedDate: row.assignedDate,
      status: row.assignedStatus
    });
    this.rows.splice(index, 1);
  }

  submit: Subscription;
  addRow(data?: any) {
    // console.log(this.isInvalidAsset);
    
    // if(!this.isInvalidAsset){
      let newRow;
      console.log(data);
      
      if(data){
         newRow = {
          id: data.id,
          assetId: data.userAssetId,
          assetName: data.userAsset.assetName,
          serialNumber: data.userAsset.serialNumber,
          assignedDate: data.assignedDate,
          status: data.userAsset.assignedStatus,
          returnDate: data.returnDate,
          note: data.note
         }
      }
      else if (this.form.valid)  newRow = { ...this.form.value.newRow };
      this.rows.push(newRow);
      console.log(this.rows);
      
      this.form.reset();
    // }
    // else{
    //   const data = {
    //     assetName: this.form.getRawValue().newRow.assetName,
    //     serialNumber: this.form.getRawValue().newRow.serialNumber,
    //     assignedDate: this.form.getRawValue().newRow.assignedDate
    //   }
    //   this.submit = this.assetService.addAssets(data).subscribe((res: any)=>{
    //     this.snackbar.open("Asset added succesfully...","" ,{duration:3000})
    //     let newRow;
    //     if(data) { 
    //       newRow = {
    //         ...data, 
    //         assetId: res.id
    //       }
    //     }
    //     this.rows.push(newRow);
    //     this.form.reset();
    //     this.getAssets();
    //   })
    // }
  }

  assetSub!: Subscription;
  saveAssets() {
    const data = {
      userId: this.route.snapshot.params['id']?this.route.snapshot.params['id']:this.assetData.id,
      assets: this.rows
    }
    if(this.updateStatus){
      this.assetSub = this.assetService.updateUserAssets(data, this.id).subscribe((res: any) => {
        console.log(res);
        if(res.success){
          this.getAssets();
          this.dialogRef?.close();
          this.snackbar.open("Assets updated successfully...","" ,{duration:3000})
        }else{
          alert(res.message)
        }
      })
    }else{
      this.assetSub = this.assetService.addAssetDetails(data).subscribe(() => {
        this.getAssets();
        this.updateStatus = true;
        this.dialogRef?.close();
        this.snackbar.open("Assets saved successfully...","" ,{duration:3000})
      })
    }
    this.getUserById(this.id)
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

    // this.userAssetSub = this.userService.getUserAssets(department).subscribe((res) => {
    //   const users = res;

    //   if (users.length > 0) {
    //     const maxId = users.reduce((prevMax, inv) => {
    //       const empNoParts = inv.assetCode.split('-'); // Split by '-'

    //       const idNumber = parseInt(empNoParts[empNoParts.length - 1], 10);

    //       prefix = this.extractLetters(inv.assetCode); // Get the prefix

    //       if (!isNaN(idNumber)) {
    //         // Compare and return the maximum ID
    //         return idNumber > prevMax ? idNumber : prevMax;
    //       } else {
    //         return prevMax;
    //       }
    //     }, 0);

    //     const nextId = maxId + 1;

    //     const paddedId = `${prefix}-${twoDigitYear}-${department}-${nextId.toString().padStart(3, "0")}`;

    //     const ivNum = paddedId;
    //     this.assetCode = ivNum;
    //     this.form.get('assetCode')?.setValue(ivNum);
    //   } else {
    //     const nextId = 0o1;

    //     const departmentAbbreviations: { [key: string]: string } = {
    //       Finance: "FIN",
    //       Sales: "SAL",
    //       Marketing: "MKT",
    //       Designing: "DES",
    //       Logistics: "LOG",
    //       Operation: "OPS",
    //       HR: "HR",
    //       IT: "IT"
    //   };

    //   const departmentAbbr = department 
    //   ? departmentAbbreviations[department] || department 
    //   : "GEN";

    //     prefix = `OAC-${twoDigitYear}-${departmentAbbr}-`;
        
    //     const paddedId = `${prefix}${nextId.toString().padStart(3, "0")}`;
    //     const ivNum = paddedId;

    //     this.form.get('assetCode')?.setValue(ivNum);
    //     this.assetCode = ivNum;
        
    //   }
    // });
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
        const data = {
          returnDate: res.data.returnDate,
          note: res.data.note
        };
        
        this.assetSub = this.assetService.returnUserAssets(data, this.rows[i].id).subscribe(() => {
          this.getUserById(this.id)
          this.getAssets()
          this.snackbar.open("Assets updated successfully...","" ,{duration:3000})
        })
      }
    });
  }
  

}
