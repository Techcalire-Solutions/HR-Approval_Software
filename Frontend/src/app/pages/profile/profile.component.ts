/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { StatutoryInfo } from '../../common/interfaces/users/statutory-info';
import { UsersService } from '@services/users.service';
import { User } from '../../common/interfaces/users/user';
import { UserAccount } from '../../common/interfaces/users/user-account';
import { UserDocument } from '../../common/interfaces/users/user-document';
import { UserPersonal } from '../../common/interfaces/users/user-personal';
import { UserPosition } from '../../common/interfaces/users/user-position';
import { PayrollService } from '@services/payroll.service';
import { MonthlyPayroll } from '../../common/interfaces/payRoll/monthlyPayroll';
import { PayrollLog } from '../../common/interfaces/payRoll/payroll-log';
import { UserAssets } from '../../common/interfaces/users/user-assets';
import { UserQualification } from '../../common/interfaces/users/user-qualification';
import { SafePipe } from "../../common/pipes/safe.pipe";
import { Nominee } from '../../common/interfaces/users/nominee';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    RouterModule,
    FlexLayoutModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    DatePipe,
    MatExpansionModule,
    MatAccordion,
    UpperCasePipe,
    SafePipe
],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  public userImage = 'img/users/avatar.png';
  apiUrl = 'https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  private loginService = inject(LoginService)
  userService = inject(UsersService);

  ngOnInit(){
    if(localStorage.getItem('token')){
      const token: any = localStorage.getItem('token')
      const user = JSON.parse(token)
      this.getUser(user.id)
    }
  }

  userSub!: Subscription;
  user: User;
  getUser(id: number){
    this.userSub = this.loginService.getUserById(id).subscribe(x => {
      this.user = x
      this.getPersonsalData(x.id);
      this.getAccountData(x.id);
      this.getStatutoryData(x.id);
      this.getPositionData(x.id);
      this.getDocuments(x.id);
      this.getAssets(x.id);
      this.getPayrollLog(x.id);
      this.getMonthlySalary(x.id);
      this.getQualData(x.id);
      this.getNomineeData(x.id);
    });
  }

  puSub!: Subscription;
  userPersonal: UserPersonal;
  getPersonsalData(id: number){
    this.puSub = this.userService.getUserPersonalDetailsByUser(id).subscribe(x => {
      this.userPersonal = x;
    });
  }

  suSub!: Subscription;
  userStat: StatutoryInfo;
  getStatutoryData(id: number){
    this.suSub = this.userService.getUserStatutoryuDetailsByUser(id).subscribe(x => {
      this.userStat = x;
    })
  }

  auSub!: Subscription;
  accounts: UserAccount
  getAccountData(id: number){
    this.auSub = this.userService.getUserAcoountDetailsByUser(id).subscribe(x => {
      this.accounts = x;
    });
  }

  nomineeSub!: Subscription;
  nominee: Nominee
  getNomineeData(id: number){
    this.nomineeSub = this.userService.getUserNomineeDetailsByUser(id).subscribe(x => {
      this.nominee = x;
    })
  }

  posuSub!: Subscription;
  positions: UserPosition;
  getPositionData(id: number){
    this.posuSub = this.userService.getUserPositionDetailsByUser(id).subscribe(x => {
      this.positions = x;
    })
  }

  docSub!: Subscription;
  documents: UserDocument[] = [];
  getDocuments(id: number){
    this.docSub = this.userService.getUserDocumentsByUser(id).subscribe(x => {
      this.documents = x
    });
  }

  assetSub!: Subscription;
  assets: UserAssets;
  getAssets(id: number){
    this.assetSub = this.userService.getUserAssetsByUser(id).subscribe(x => {
      this.assets = x;
    })
  }

  payLogSUb!: Subscription;
  private payrollService = inject(PayrollService);
  payrollLog: PayrollLog[] = [];
  getPayrollLog(id: number){
    this.payLogSUb = this.payrollService.getPayrollLogByUser(id).subscribe(x => {
      this.payrollLog = x;
    });
  }

  monthSalarySub!: Subscription;
  monthlySalary: MonthlyPayroll[] = [];
  getMonthlySalary(id: number){
    this.monthSalarySub = this.payrollService.getMonthlyPayrollByUser(id).subscribe(x => {
      this.monthlySalary = x;
    });
  }

  qualSub!: Subscription;
  qualifications: UserQualification;
  getQualData(id: number){
    this.qualSub = this.userService.getUserQualDetailsByUser(id).subscribe(x => {
      this.qualifications = x;
    })
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.puSub?.unsubscribe();
    this.suSub?.unsubscribe();
    this.auSub?.unsubscribe();
    this.posuSub?.unsubscribe();
    this.qualSub?.unsubscribe();
    this.monthSalarySub?.unsubscribe();
    this.payLogSUb?.unsubscribe();
    this.assetSub?.unsubscribe();
    this.docSub?.unsubscribe();
    this.nomineeSub?.unsubscribe();
  }

  private router = inject(Router);
  openPayroll(id: number){
    this.router.navigateByUrl('login/payroll/month-end/payslip/open/'+ id)
  }

}
