import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AssetsService } from '@services/assets.service';
import { Subscription } from 'rxjs';
import { Assets } from '../../../common/interfaces/assets/assets';
import { AddAssetsComponent } from '../add-assets/add-assets.component';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { UserAssets } from '../../../common/interfaces/users/user-assets';

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
  selector: 'app-add-user-assets',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatDatepickerModule, MatIconModule, MatInputModule, MatButtonModule, 
      MatDialogModule, MatCardModule, MatNativeDateModule],
  templateUrl: './add-user-assets.component.html',
  styleUrl: './add-user-assets.component.scss',
  standalone: true,
  providers: [provideMomentDateAdapter(MY_FORMATS)]
})
export class AddUserAssetsComponent {
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    assetName: ['', Validators.required],
    assetNumber: [''],
    assetHandoverNumber: [''],
    description: [''],
    serialNumber: [''],
    purchasedDate: <any>[],
    purchasedFrom: [''],
    invoiceNo: [''],
    assignedStatus: [false]
  });

  editStatus: boolean = false;
  private dialogRef = inject(MatDialogRef<AddAssetsComponent>)
  private asset = inject(MAT_DIALOG_DATA);
  ngOnInit(): void {
    if(this.asset) {
      if(this.asset.initialName) this.form.get('assetName')?.setValue(this.asset.initialName)
      else this.patchAsset(this.asset)}
  }

  patchAsset(asset: UserAssets){
    this.editStatus = true;
    this.form.patchValue({
      assetName: asset.assetName,
      assetNumber: asset.assetNumber,
      assetHandoverNumber: asset.assetHandoverNumber,
      serialNumber: asset.serialNumber,
      purchasedDate: asset.purchasedDate,
      purchasedFrom: asset.purchasedFrom,
      invoiceNo: asset.invoiceNo,
      description: asset.description,
    })
  }

  private submit!: Subscription;
  private readonly assetService = inject(AssetsService);
  private readonly snackBar = inject(MatSnackBar);
  onSubmit(){
    if(this.editStatus){
      this.submit = this.assetService.editUserAssets( this.form.getRawValue(), this.asset.id).subscribe(data => {
        this.dialogRef.close()
        this.snackBar.open("Asset updated succesfully...","" ,{duration:3000})
      });
    }else{
      this.submit = this.assetService.addUserAssets(this.form.getRawValue()).subscribe((res)=>{
        this.dialogRef.close();
        this.snackBar.open("Asset added succesfully...","" ,{duration:3000})
      })
    }
  }

  ngOnDestroy(): void {
    this.submit?.unsubscribe();
  }

}
