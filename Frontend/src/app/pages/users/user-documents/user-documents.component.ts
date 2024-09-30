import { MatInputModule } from '@angular/material/input';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UserDocument } from '../../../common/interfaces/user-document';

@Component({
  selector: 'app-user-documents',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatProgressBarModule, MatIconModule, MatInputModule, MatButtonModule, CommonModule,
    MatCardModule
  ],
  templateUrl: './user-documents.component.html',
  styleUrl: './user-documents.component.scss'
})
export class UserDocumentsComponent implements OnInit, OnDestroy {
  ngOnInit(): void {  }

  trigger(){
    this.addDoc();
  }

  editStatus: boolean[] = [];
  id: number[] = [];
  triggerNew(data?: any): void {
    if(data){
      if(data.updateStatus){
        this.getDocumentDetailsByUser(data.id)
      }else{
        this.addDoc()
      }
    }
  }

  docSub!: Subscription;
  getDocumentDetailsByUser(id: number){
    this.docSub = this.userSevice.getUserDocumentsByUser(id).subscribe(res=>{
      if(res.length > 0){
        for(let i = 0; i < res.length; i++){
          this.id[i] = res[i].id
          this.editStatus[i] = true;
          this.addDoc(res[i])
          if(res[i].docUrl){
            this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ res[i].docUrl }`;
          }
          console.log(this.imageUrl[i]);
          
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.submit?.unsubscribe();
  }
  @Input() data: any;

  fb = inject(FormBuilder);
  userSevice = inject(UsersService)
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  mainForm = this.fb.group({
    uploadForms: this.fb.array([])
  });

  index!: number;
  clickedForms: boolean[] = [];
  addDoc(data?:any){
    this.doc().push(this.newDoc(data));
    this.clickedForms.push(false);
  }

  removeData(index: number) {
    console.log(index);
    
    const formGroup = this.doc().at(index).value;
    console.log(formGroup);
    
    // Check if form group is dirty (any changes made)
    if (formGroup.docName != '' || formGroup.docUrl != '') {
      // Call the API to handle the update before removing
      this.userSevice.deleteUserDocComplete(this.id[index]).subscribe({
        next: (response) => {
          console.log('Update successful:', response);
          // Remove the row only after successful API call
          formGroup.removeAt(index);
        },
        error: (error) => {
          console.error('Error during update:', error);
        }
      });
    } else {
      // Remove the row directly if no changes
      formGroup.removeAt(index);
    }
  }
  

  doc(): FormArray {
    return this.mainForm.get("uploadForms") as FormArray;
  }

  newDoc(initialValue?: UserDocument): FormGroup {
    return this.fb.group({
      userId: [initialValue?initialValue.userId : this.data.id],
      docName: [initialValue?initialValue.docName : '', Validators.required],
      docUrl: [initialValue?initialValue.docUrl : '', Validators.required]
    });
  }

  files: File[] = [];
  uploadProgress: number[] = [];
  uploadSuccess: boolean[] = [];

  fileType: string;
  uploadSub!: Subscription;
  imageUrl: any[] = [];
  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    let file: any = input.files?.[0];
    this.fileType = file.type.split('/')[1];
    if (file) {
      let userName = this.data.name;
      // let userName = 'Nishida';
      const docFormGroup = this.doc().at(i) as FormGroup;
      const docName = docFormGroup.value.docName;  // Extract docName from the form
      const name = `${userName}_${docName}`;
    // console.log(this.data, docName);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    this.uploadSub = this.userSevice.uploadUserDoc(formData).subscribe({
        next: (invoice) => {
          this.doc().at(i).get('docUrl')?.setValue(invoice.fileUrl);
          this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ invoice.fileUrl}`;
        }
      });
    }
  }

  isAnyFormClicked(): boolean {
    console.log(this.clickedForms);
    
    for(let i = 0; i < this.clickedForms.length; i++) {
      if (!this.clickedForms[i]) {
        return false; // Return false if any value is false
      }
    }
    return true
  }

  submit!: Subscription;
  onSubmit(i: number): void {
    let form = this.doc().at(i) as FormGroup
    this.clickedForms[i] = true;
    if(this.editStatus[i]){
      this.submit = this.userSevice.updateUserDocumentDetails(this.id[i], form.value).subscribe(res => {
        this.snackBar.open(`${res.docName} is added to employee data`,"" ,{duration:3000})
      });
    }else{
      this.submit = this.userSevice.addUserDocumentDetails(form.value).subscribe(res => {
        this.snackBar.open(`${res.docName} is added to employee data`,"" ,{duration:3000})
      });
    }
  }

  completeForm(){
    this.snackBar.open(`Upload completed successfully...`,"" ,{duration:3000})
    this.router.navigateByUrl('/login/users')
  }

  onDeleteImage(i: number){
    this.userSevice.deleteUserDoc(this.imageUrl[i], this.id[i]).subscribe(x => {
      this.imageUrl[i] = '';
      this.doc().at(i).get('docUrl')?.setValue('');
      this.snackBar.open(`${this.doc().at(i).get('docUrl')?.value} is deleted from employee data`,"" ,{duration:3000})
    })
  }
}
