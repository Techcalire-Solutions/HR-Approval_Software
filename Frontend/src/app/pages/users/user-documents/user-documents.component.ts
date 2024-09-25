import { MatInputModule } from '@angular/material/input';
import { HttpEventType } from '@angular/common/http';
import { Component, inject, Input } from '@angular/core';
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

@Component({
  selector: 'app-user-documents',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatProgressBarModule, MatIconModule, MatInputModule, MatButtonModule, CommonModule],
  templateUrl: './user-documents.component.html',
  styleUrl: './user-documents.component.scss'
})
export class UserDocumentsComponent {
  @Input() data: any;

  fb = inject(FormBuilder);
  userSevice = inject(UsersService)
  snackBar = inject(MatSnackBar);
  router = inject(Router);

  mainForm = this.fb.group({
    uploadForms: this.fb.array([])
  });

  index!: number;
  addDoc(data?:any){

    if(this.index === undefined) this.index = 0;
    else this.index += 1
    // this.getProduct()
    // this.getUnit()
    this.doc().push(this.newDoc(data));
  }

  removeData(i: number){
    this.doc().removeAt(i);
  }

  doc(): FormArray {
    return this.mainForm.get("uploadForms") as FormArray;
  }

  newDoc(initialValue?: any): FormGroup {
    return this.fb.group({
      // userId: [this.data.id],
      docName: [''],
      docUrl: ['']
    });
  }

  files: File[] = [];
  uploadProgress: number[] = [];
  uploadSuccess: boolean[] = [];

  fileType: string;
  uploadSub!: Subscription;
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
      }
      });
    }
  }

  submit!: Subscription;
  onSubmit(i: number): void {
    let form = this.doc().at(i) as FormGroup
    this.submit = this.userSevice.addUserDocumentDetails(form.value).subscribe(res => {
      this.snackBar.open(`${res.docName} is added to employee data`,"" ,{duration:3000})
    });
  }

  completeForm(){
    this.router.navigateByUrl('/login/users')
  }
}
