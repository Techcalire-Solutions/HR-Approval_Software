import { Component, Inject, Optional } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../../common/interfaces/user';
import { MatCardModule } from '@angular/material/card';
@Component({
  selector: 'app-verification-dialogue',
  standalone: true,
  imports: [CommonModule, MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,],
  templateUrl: './verification-dialogue.component.html',
  styleUrl: './verification-dialogue.component.scss'
})
export class VerificationDialogueComponent {
  ngOnDestroy(): void {
  }

  constructor(public dialog: MatDialog, @Optional() public dialogRef: MatDialogRef<VerificationDialogueComponent>, private fb: FormBuilder,
   @Optional() @Inject(MAT_DIALOG_DATA) private dialogData: any, private loginService: LoginService){}

   form = this.fb.group({
    remarks: [''],
    amId: [],
    accountantId: [],
    spId: [''],
   });

  invoiceNo!: string;
  status!: string;
  ngOnInit(): void {
    this.invoiceNo = this.dialogData.invoiceNo;
    this.status = this.dialogData.status;


    this.form.get('spId')?.setValue(this.dialogData.sp)
    if(this.status == 'KAM VERIFIED') this.getAm()
    if(this.status == 'AM VERIFIED') this.getMa()

  if(this.status === 'AM REJECTED' || this.status === 'KAM REJECTED') this.isSelectionMade=true;
  }

  isSelectionMade: any = false;
  onSelectionChange() {
 this.isSelectionMade = this.form.get('amId')?.valid || this.form.get('accountantId')?.valid;
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onConfirmClick(): void {
    let data = {
      value: true,
      remarks: this.form.get('remarks')?.value,
      amId:  this.form.get('amId')?.value,
      accountantId: this.form.get('accountantId')?.value
    }
    this.dialogRef.close(data);
  }

  userSub!: Subscription;
  am: User[] = [];
  getAm() {
    this.userSub = this.loginService.getUserByRole(3).subscribe(data => {
  
      this.am = data;
      });

  }


  getMa(){
    this.userSub = this.loginService.getUserByRole(4).subscribe(data => {
      this.am = data;
    });
  }

}

