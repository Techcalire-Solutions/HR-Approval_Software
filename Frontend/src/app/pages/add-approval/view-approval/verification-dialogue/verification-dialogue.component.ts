import { Component, Inject, Optional } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from '@data/user';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-verification-dialogue',
  standalone: true,
  imports: [ReactiveFormsModule,
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
    console.log(this.dialogData);

    this.form.get('spId')?.setValue(this.dialogData.sp)
    if(this.status == 'KAM VERIFIED') this.getAm()
    if(this.status == 'AM VERIFIED') this.getMa()
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
      console.log('data', data);

      // Ensure to match the expected structure
      this.am = data.map(item => ({
        ...item,
        // createdAt: item.createdAt || null // Add default value if not present
      }));
    });
  }


  getMa(){
    this.userSub = this.loginService.getUserByRole(4).subscribe(data => {
      // this.am = data;
    });
  }

}

