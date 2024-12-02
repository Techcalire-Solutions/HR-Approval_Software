/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-qualification',
  standalone: true,
  imports: [MatCardModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule],
  templateUrl: './user-qualification.component.html',
  styleUrl: './user-qualification.component.scss'
})
export class UserQualificationComponent {
  private fb = inject(FormBuilder);
  @Input() qualData: any;

  trigger(){
    this.addQual();
    this.addExperience();
  }

  editStaus: boolean = false;
  id: number = 0;
  triggerNew(data?: any): void {
    if(data){
      if(data.updateStatus){
        this.id = data.id;
        this.getQualDetailsByUser(data.id)
      }else{
        this.addExperience()
        this.addQual()
      }
    }
  }

  docSub!: Subscription;
  getQualDetailsByUser(id: number){
    this.docSub = this.userService.getUserQualDetailsByUser(id).subscribe(res=>{
      if(res){
        this.editStaus = true;
        if(res.experience.length > 0){
          for (let index = 0; index < res.experience.length; index++) {
            this.addExperience(res.experience[index])
          }
          
        }
        if(res.qualification.length > 0){
          for (let index = 0; index < res.qualification.length; index++) {
            this.addQual(res.qualification[index])
          }
        }
      }else{
        this.addExperience()
        this.addQual()
      }
    })
  }
  
  form = this.fb.group({
    userId : [''],
    qualification: this.fb.array([]),
    experience: this.fb.array([])
  });

  qualification(): FormArray {
    return this.form.get('qualification') as FormArray;
  }

  exp(): FormArray {
    return this.form.get('experience') as FormArray;
  }

  // Add a new language entry
  addQual(data?: any): void {
    this.qualification().push(
      this.fb.group({
        field: [data? data.field : '', Validators.required],
        university: [data? data.university : ''],
        passout: [data? data.passout : ''],
        marks: [data? data.marks : '', [ Validators.min(0), Validators.max(100) ]]
      })
    );
  }

  addExperience(data?: any): void {
    this.exp().push(
      this.fb.group({
        designation: [data? data.designation : '', Validators.required],
        company: [data? data.company : ''],
        yearOfExperience: [data? data.yearOfExperience : ''],
        contactNumber: [data?data.contactNumber : '', [ Validators.pattern(/^\d{10}$/)]]
      })
    );
  }

  removeQual(index: number): void {
    this.qualification().removeAt(index);
  }

  // Remove an experience entry by index
  removeExperience(index: number): void {
    this.exp().removeAt(index);
  }

  submit!: Subscription;
  private userService = inject(UsersService);
  private snackBar = inject(MatSnackBar);
  @Output() dataSubmitted = new EventEmitter<any>();
  onSubmit(): void {
    const submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.qualData.id;
    
    if (!this.editStaus) {
      this.submit = this.userService.addUserQualification(submit).subscribe(result => {
        console.log(result);
        this.snackBar.open("Qualification for user added succesfully...","" ,{duration:3000})
        this.dataSubmitted.emit( {isFormSubmitted: true} );
      });
    } else {
      this.submit = this.userService.updateUserQualification(submit, this.id).subscribe(result => {
        console.log(result);
        this.snackBar.open("Qualification for user added succesfully...","" ,{duration:3000})
        this.dataSubmitted.emit( {isFormSubmitted: true} );
      });
    }
  }

  @Output() nextTab = new EventEmitter<void>();
  triggerNextTab() {
    this.nextTab.emit();
  }

}
