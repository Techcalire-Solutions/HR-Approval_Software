import { MatButtonModule } from '@angular/material/button';
import { UsersService } from './../../../services/users.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-statuatory-info',
  standalone: true,
  imports: [ MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule ],
  templateUrl: './statuatory-info.component.html',
  styleUrl: './statuatory-info.component.scss'
})
export class StatuatoryInfoComponent implements OnDestroy {
  ngOnDestroy(): void {
    this.pUSub?.unsubscribe();
    this.submitSub?.unsubscribe();
  }
  
  @Input() statuatoryData: any;

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  snackBar = inject(MatSnackBar);

  form = this.fb.group({
    userId : [],
    adharNo : [''],
    panNumber : [''],
    esiNumber : [''],
    uanNumber : [''],
    insuranceNumber: ['']
  });

  editStatus: boolean = false;
  triggerNew(data?: any): void {
    if(data){
      if(data.updateStatus){
        this.getStatutoryDetailsByUser(data.id)
      }
    }
  }

  pUSub!: Subscription;
  id: number;
  getStatutoryDetailsByUser(id: number){
    this.pUSub = this.userService.getUserStatutoryuDetailsByUser(id).subscribe(data=>{
      if(data){
        this.id = data.id;
        this.editStatus = true;
        this.form.patchValue({
          adharNo : data.adharNo,
          panNumber : data.panNumber,
          esiNumber : data.esiNumber,
          uanNumber : data.uanNumber,
          insuranceNumber : data.insuranceNumber
        })
      }
    })
  }

  @Output() dataSubmitted = new EventEmitter<any>();
  submitSub!: Subscription;
  onSubmit(){
    console.log(this.editStatus);
    
    let submit = {
      ...this.form.getRawValue()
    }
    submit.userId = submit.userId ? submit.userId : this.statuatoryData.id;
    if(this.editStatus){
      this.submitSub = this.userService.updateUserStatutory(this.id, submit).subscribe(data => {
        this.snackBar.open("Statutory Details updated succesfully...","" ,{duration:3000})
        this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }
    else{
      this.submitSub = this.userService.addStautoryInfo(submit).subscribe(data => {
        this.snackBar.open("Statutory Details added succesfully...","" ,{duration:3000})
        this.dataSubmitted.emit( {isFormSubmitted: true} );
      })
    }
  }

  @Output() nextTab = new EventEmitter<void>(); 
  triggerNextTab() {
    this.nextTab.emit();
  }
}
