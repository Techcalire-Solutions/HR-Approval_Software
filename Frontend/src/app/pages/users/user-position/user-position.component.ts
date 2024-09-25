import { Component, EventEmitter, Input, input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-position',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule ],
  templateUrl: './user-position.component.html',
  styleUrl: './user-position.component.scss'
})
export class UserPositionComponent {
  @Input() positionData: any;

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);

  form = this.fb.group({
    userId : [],
    division : [''],
    costCentre : [''],
    grade : [''],
    designation : [''],
    location : [''],
    department : [''],
    office  : [''],
    salary : [''],
    probationPeriod : [''],
    officialMailId: ['', Validators.email]
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      if(data.updateStatus){
        this.getPositionDetailsByUser(data.id)
      }
    }
  }

  pUSub!: Subscription;
  id: number
  getPositionDetailsByUser(id: number){
    this.pUSub = this.userService.getUserPositionDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          division : data.division,
          costCentre : data.costCentre,
          grade : data.grade,
          designation : data.designation,
          location : data.location,
          department : data.department,
          office  : data.office,
          salary : data.salary,
          probationPeriod: data.probationPeriod,
          officialMailId: data.officialMailId
        })
      }
    })
  }

  @Output() dataSubmitted = new EventEmitter<any>();
  submitSub!: Subscription;
  onSubmit(){
    let submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.positionData.id;
    if(this.editStatus){
      this.submitSub = this.userService.updateUserPosition(this.id, submit).subscribe(data => {
        this.snackBar.open("Postion Details updated succesfully...","" ,{duration:3000})
        this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }else{
      this.submitSub = this.userService.addUserPositionDetails(submit).subscribe(data => {
        this.snackBar.open("Postion Details added succesfully...","" ,{duration:3000})
        this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }
  }
  
  @Output() nextTab = new EventEmitter<void>(); 
  triggerNextTab() {
    this.nextTab.emit();
  }
}
