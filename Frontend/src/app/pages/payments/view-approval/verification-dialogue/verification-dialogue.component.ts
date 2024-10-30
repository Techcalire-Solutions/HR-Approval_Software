import { Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { User } from '../../../../common/interfaces/user';
import { MatCardModule } from '@angular/material/card';
@Component({
  selector: 'app-verification-dialogue',
  standalone: true,
  imports: [MatCardModule,
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
    this.userSub?.unsubscribe();
  }
  
  loginService=inject(LoginService)
  fb=inject(FormBuilder)
  dialog=inject(MatDialog)
  dialogRef = inject(MatDialogRef<VerificationDialogueComponent>)
  dialogData = inject(MAT_DIALOG_DATA);

   form = this.fb.group({
    remarks: [''],
    kamId: [],
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
    if(this.status == 'AM VERIFIED'||this.status == 'AM Verified') this.getMa()
    if(this.status == 'AM APPROVED') this.getKam()

    if(this.status === 'AM REJECTED' || this.status === 'KAM REJECTED' || this.status === 'AM DECLINED' || this.status === 'AM Rejected') 
      this.isSelectionMade=true;
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
      kamId:  this.form.get('kamId')?.value,
      amId:  this.form.get('amId')?.value,
      accountantId: this.form.get('accountantId')?.value
    }
    this.dialogRef.close(data);
  }

  userSub!: Subscription;
  am: User[] = [];
  getAm() {
    this.userSub = this.loginService.getUserByRoleName('Manager').subscribe(data => {
      this.am = data;
    });
  }

  kamSub!: Subscription;
  kam: User[] = [];
  getKam() {
    this.userSub = this.loginService.getUserByRole(2).subscribe(data => {
      this.kam = data;
    });
  }

  getMa(){
    this.userSub = this.loginService.getUserByRoleName('Accountant').subscribe(data => {
      this.am = data;
    });
  }

}

