import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-assets',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './user-assets.component.html',
  styleUrl: './user-assets.component.scss'
})
export class UserAssetsComponent {
  assetForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.assetForm = this.fb.group({
      assets: this.fb.array([this.createAssetFormGroup()]) // Start with one asset field
    });
  }

  ngOnInit(): void {}

  // Get the assets FormArray
  get assets(): FormArray {
    return this.assetForm.get('assets') as FormArray;
  }

  // Create a new FormGroup for an asset
  createAssetFormGroup(): FormGroup {
    return this.fb.group({
      assetName: ['', Validators.required],
      assetType: ['', Validators.required],
      assignedDate: ['', Validators.required]
    });
  }

  // Add a new asset form group to the FormArray
  addAsset() {
    this.assets.push(this.createAssetFormGroup());
  }

  // Remove an asset form group from the FormArray
  removeAsset(index: number) {
    this.assets.removeAt(index);
  }

  // Handle form submission
  onSubmit() {
    if (this.assetForm.valid) {
      const assetData = this.assetForm.value.assets;
      // this.assetService.addMultipleAssets(assetData).subscribe(
      //   response => {
      //     console.log('Assets successfully added!', response);
      //   },
      //   error => {
      //     console.error('Error adding assets:', error);
      //   }
      // );
    }
  }
}