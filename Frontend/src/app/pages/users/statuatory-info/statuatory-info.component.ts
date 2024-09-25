import { MatButtonModule } from '@angular/material/button';
import { UsersService } from './../../../services/users.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-statuatory-info',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule ],
  templateUrl: './statuatory-info.component.html',
  styleUrl: './statuatory-info.component.scss'
})
export class StatuatoryInfoComponent {
  @Input() statuatoryData: any;

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);

  form = this.fb.group({
    userId : [],
    adharNo : [''],
    panNumber : [''],
    esiNumber : [''],
    uanNumber : ['']
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      console.log(data);
      
      if(data.updateStatus){
        this.editStatus = true;
        console.log(this.editStatus);
        
        this.getStatutoryDetailsByUser(data.id)
      }
    }
  }

  pUSub!: Subscription;
  getStatutoryDetailsByUser(id: number){
    console.log(id);
    this.pUSub = this.userService.getUserStatutoryuDetailsByUser(id).subscribe(data=>{
      if(data){
        this.form.patchValue({
          adharNo : data.adharNo,
          panNumber : data.panNumber,
          esiNumber : data.esiNumber,
          uanNumber : data.uanNumber
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
    submit.userId = this.statuatoryData.id;
    console.log(submit);
    this.submitSub = this.userService.addStautoryInfo(submit).subscribe(data => {
      this.snackBar.open("Statutory Details added succesfully...","" ,{duration:3000})
      this.dataSubmitted.emit( {isFormSubmitted: true} );
    })
  }

  @Output() nextTab = new EventEmitter<void>(); 
  triggerNextTab() {
    this.nextTab.emit();
  }
}
