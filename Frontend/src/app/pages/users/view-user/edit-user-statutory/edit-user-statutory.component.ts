/* eslint-disable @typescript-eslint/no-explicit-any */
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MY_FORMATS } from '../../personal-details/personal-details.component';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit-user-statutory',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule, 
      MatDatepickerModule, MatIconModule],
  templateUrl: './edit-user-statutory.component.html',
  styleUrl: './edit-user-statutory.component.scss',
      providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
      changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUserStatutoryComponent implements OnInit, OnDestroy{
    dialogRef = inject(MatDialogRef<EditUserStatutoryComponent>, { optional: true })
    statuatoryData = inject(MAT_DIALOG_DATA, { optional: true });

    ngOnInit(): void {
      if(this.statuatoryData){
        this.getStatutoryDetailsByUser(this.statuatoryData.id)
      }
    }

    pUSub!: Subscription;
    private id: number;
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
            insuranceNumber : data.insuranceNumber,
            pfNumber : data.pfNumber,
            passportNumber : data.passportNumber,
            passportExpiry: data.passportExpiry,
          })
        }
      })
    }
  

    private fb = inject(FormBuilder);
    form = this.fb.group({
      userId : <any>[],
      adharNo : [''],
      panNumber : [''],
      esiNumber : [''],
      uanNumber : [''],
      insuranceNumber: [''],
      pfNumber : [''],
      passportNumber : [''],
      passportExpiry: <any>[],
    });

    private submitSub!: Subscription;
    isNext: boolean = false;
    private datePipe = inject(DatePipe);
    editStatus: boolean = false;
    private userService = inject(UsersService);
    private snackBar = inject(MatSnackBar);
    onSubmit(){
      this.isNext = true
      const submit = {
        ...this.form.getRawValue()
      }
      submit.userId = submit.userId ? submit.userId : this.statuatoryData.id;
      if (this.form.get('passportExpiry')?.value) {
        const passportExpiry = this.form.get('passportExpiry')?.value as string | number | Date;
        submit.passportExpiry = this.datePipe.transform(passportExpiry, 'yyyy-MM-dd');
      }
      if(this.editStatus){
        this.submitSub = this.userService.updateUserStatutory(this.id, submit).subscribe(() => {
          this.snackBar.open("Statutory Details updated succesfully...","" ,{duration:3000})
          // this.dataSubmitted.emit( {isFormSubmitted: true} );
        })
      }
      else{
        this.submitSub = this.userService.addStautoryInfo(submit).subscribe((res) => {        
          this.editStatus = true;
          this.id = res.id;
          this.snackBar.open("Statutory Details added succesfully...","" ,{duration:3000})
          // this.dataSubmitted.emit( {isFormSubmitted: true} );
        })
      }
    }

    ngOnDestroy(): void {
      this.pUSub?.unsubscribe();
      this.submitSub?.unsubscribe();
    }
}

