import { Component, EventEmitter, Input, input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-position',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule ],
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
    salary : ['']
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      console.log(data);
      
      if(data.updateStatus){
        this.editStatus = true;
        console.log(this.editStatus);
        
        this.getPositionDetailsByUser(data.id)
      }
    }
  }

  pUSub!: Subscription;
  getPositionDetailsByUser(id: number){
    console.log(id);
    this.pUSub = this.userService.getUserPositionDetailsByUser(id).subscribe(data=>{
      if(data){
        this.form.patchValue({
          division : data.division,
          costCentre : data.costCentre,
          grade : data.grade,
          designation : data.designation,
          location : data.location,
          department : data.department,
          office  : data.office,
          salary : data.salary
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
    submit.userId = this.positionData.id;

    this.submitSub = this.userService.addUserPositionDetails(submit).subscribe(data => {
      this.snackBar.open("Postion Details added succesfully...","" ,{duration:3000})
      this.dataSubmitted.emit( {isFormSubmitted: true} );
    })
  }
  
  @Output() nextTab = new EventEmitter<void>(); 
  triggerNextTab() {
    this.nextTab.emit();
  }
}
