/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MY_FORMATS } from '../../users/personal-details/personal-details.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { Assets } from '../../../common/interfaces/assets/assets';
import { Subscription } from 'rxjs';
import { AssetsService } from '@services/assets.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-assets',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatDatepickerModule, MatIconModule, MatInputModule, MatButtonModule, 
    MatDialogModule, MatCardModule],
  templateUrl: './add-assets.component.html',
  styleUrl: './add-assets.component.scss',
  providers: [ provideMomentDateAdapter(MY_FORMATS), DatePipe ]
})
export class AddAssetsComponent implements OnInit, OnDestroy{
  private readonly fb = inject(FormBuilder);
  form = this.fb.group({
    assetName: ['', Validators.required],
    identifierType: ['', Validators.required],
    identificationNumber: ['', Validators.required],
    description: [''],
    purchasedDate: <any>[],
    purchasedFrom: [''],
    invoiceNo: ['']
  });

  editStatus: boolean = false;
  private dialogRef = inject(MatDialogRef<AddAssetsComponent>)
  private asset = inject(MAT_DIALOG_DATA);
  ngOnInit(): void {
    if(this.asset) this.patchAsset(this.asset)
  }

  patchAsset(asset: Assets){
    this.editStatus = true;
    this.form.patchValue({
      assetName: asset.assetName,
      description: asset.description,
      purchasedDate: asset.purchasedDate,
      purchasedFrom: asset.purchasedFrom,
      invoiceNo: asset.invoiceNo,
      identifierType: asset.identifierType,
      identificationNumber: asset.identificationNumber
    })
  }

  private submit!: Subscription;
  private readonly assetService = inject(AssetsService);
  private readonly snackBar = inject(MatSnackBar);
  onSubmit(){
    if(this.editStatus){
      this.submit = this.assetService.updateAssets(this.asset.id, this.form.getRawValue()).subscribe(data => {
        this.dialogRef.close()
        this.snackBar.open("Asset updated succesfully...","" ,{duration:3000})
      });
    }else{
      this.submit = this.assetService.addAssets(this.form.getRawValue()).subscribe((res)=>{
        this.dialogRef.close();
        this.snackBar.open("Asset added succesfully...","" ,{duration:3000})
      })
    }
  }

  ngOnDestroy(): void {
    this.submit?.unsubscribe();
  }

}
