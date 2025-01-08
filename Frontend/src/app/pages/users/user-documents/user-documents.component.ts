/* eslint-disable @typescript-eslint/no-explicit-any */
import { MatInputModule } from '@angular/material/input';
import { Component, EventEmitter, inject, Input, OnDestroy, Output } from '@angular/core';
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
import { UserDocument } from '../../../common/interfaces/users/user-document';
import { SafePipe } from "../../../common/safe.pipe";

@Component({
  selector: 'app-user-documents',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatProgressBarModule, MatIconModule, MatInputModule, MatButtonModule, CommonModule,
    MatCardModule, SafePipe],
  templateUrl: './user-documents.component.html',
  styleUrl: './user-documents.component.scss'
})
export class UserDocumentsComponent implements OnDestroy{

  trigger(){
    this.addDoc();
  }

  editStatus: boolean[] = [];
  id: number[] = [];
  triggerNew(data?: any): void {
    if(data){
      this.getDocumentDetailsByUser(data.id)
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
        }
      }else{
        this.addDoc()
      }
    })
  }

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.submit?.unsubscribe();
    this.deleteSub?.unsubscribe();
    this.deleteImageSub?.unsubscribe();
  }
  @Input() data: any;
  @Input() loading = false;
  @Output() loadingState = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private userSevice = inject(UsersService)
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  mainForm = this.fb.group({
    uploadForms: this.fb.array([])
  });

  index!: number;
  clickedForms: boolean[] = [];
  addDoc(data?:any){
    this.doc().push(this.newDoc(data));
    this.clickedForms.push(false);
  }

  deleteSub!: Subscription;
  removeData(index: number) {
    const formGroup = this.doc().at(index).value;
    if(formGroup.docUrl !== ''){
      return alert('Delete uploaded file and try again')
    }
    else if (this.id[index] != undefined) {
      this.imageUrl.splice(index, 1);
      this.deleteSub = this.userSevice.deleteUserDocComplete(this.id[index]).subscribe(()=>{
        this.doc().removeAt(index);
      })
    }else{
      this.doc().removeAt(index);
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
  allowedFileTypes = ['pdf', 'jpeg', 'jpg', 'png'];
  onFileSelected(event: Event, i: number): void {
    const input = event.target as HTMLInputElement;
    const file: any = input.files?.[0];
    this.fileType = file.type.split('/')[1];
    if (!this.allowedFileTypes.includes(this.fileType)) {
      alert('Invalid file type. Please select a PDF, JPEG, JPG, or PNG file.');
      return;
    }
    if (file) {
      const userName = this.data.name;
      const docFormGroup = this.doc().at(i) as FormGroup;
      const docName = docFormGroup.value.docName;  // Extract docName from the form
      const name = `${userName}_${docName}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    this.uploadSub = this.userSevice.uploadUserDoc(formData).subscribe({
        next: (invoice) => {
          this.doc().at(i).get('docUrl')?.setValue(invoice.fileUrl);
          this.doc().at(i).markAsDirty();
          this.imageUrl[i] = `https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/${ invoice.fileUrl}`;
        }
      });
    }
  }

  isAnyFormClicked(): boolean {
    for(let i = 0; i < this.clickedForms.length; i++) {
      if (!this.clickedForms[i]) {
        return false; // Return false if any value is false
      }
    }
    return true
  }

  isAllFormsValidAndSaved(): boolean {
    return this.doc().controls.every((form) => form.valid && form.pristine);
  }

  submit!: Subscription;
  onSubmit(i: number): void {
    this.loadingState.emit(true);
    const form = this.doc().at(i) as FormGroup
    this.clickedForms[i] = true;
    form.markAsPristine();
    if(this.editStatus[i]){
      this.submit = this.userSevice.updateUserDocumentDetails(this.id[i], form.value).subscribe(res => {
        this.id[i] = res.id
        this.snackBar.open(`${res.docName} is updated to employee data`,"" ,{duration:3000})
        this.loadingState.emit(false);
      });
    }else{
      this.submit = this.userSevice.addUserDocumentDetails(form.value).subscribe(res => {
        this.id[i] = res.id
        this.snackBar.open(`${res.docName} is added to employee data`,"" ,{duration:3000})
        this.loadingState.emit(false);
      });
    }
  }

  completeForm(){
    this.snackBar.open(`Upload completed successfully...`,"" ,{duration:3000})
    this.router.navigateByUrl('/login/users')
  }

  deleteImageSub!: Subscription;
  onDeleteImage(i: number){
    if(this.id[i]){
      this.deleteImageSub = this.userSevice.deleteUserDoc(this.id[i], this.imageUrl[i]).subscribe(()=>{
        this.imageUrl[i] = ''
          this.doc().at(i).get('docUrl')?.setValue('');
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
      });
    }else{
      this.deleteImageSub = this.userSevice.deleteUserDocByurl(this.imageUrl[i]).subscribe(()=>{
        this.imageUrl[i] = ''
          this.doc().at(i).get('docUrl')?.setValue('');
        this.snackBar.open("User image is deleted successfully...","" ,{duration:3000})
      });
    }
  }

  @Output() previousTab = new EventEmitter<void>();
  triggerPreviousTab() {
    this.previousTab.emit();
  }

  imageUploaded: boolean
  isImageUploaded(): boolean {
    const controls = this.mainForm.get('uploadForms')as FormArray;
    if( controls.length === 0) {return true}
    const i = controls.length - 1;
    if (this.imageUrl[i]) {
      return true;
    }else return false;
  }
}
