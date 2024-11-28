import { Component, inject, OnDestroy, OnInit, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import {MatAccordion, MatExpansionModule} from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { StatutoryInfo } from '../../../common/interfaces/users/statutory-info';
import { UserAccount } from '../../../common/interfaces/users/user-account';
import { UserAssets } from '../../../common/interfaces/users/user-assets';
import { UserDocument } from '../../../common/interfaces/users/user-document';
import { UserPersonal } from '../../../common/interfaces/users/user-personal';
import { UserPosition } from '../../../common/interfaces/users/user-position';
import { User } from '../../../common/interfaces/users/user';
import { PayrollService } from '@services/payroll.service';
import { PayrollLog } from '../../../common/interfaces/payRoll/payroll-log';
import { MonthlyPayroll } from '../../../common/interfaces/payRoll/monthlyPayroll';
import { SafePipe } from "../../../common/safe.pipe";

@Component({
  selector: 'app-view-user',
  standalone: true,
  imports: [MatCardModule, MatDividerModule, MatIconModule, DatePipe, UpperCasePipe, MatButtonModule,
    MatExpansionModule, CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule, SafePipe],
  templateUrl: './view-user.component.html',
  styleUrl: './view-user.component.scss',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewUserComponent implements OnInit, OnDestroy{
  apiUrl ='https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  public userImage = 'img/users/default-user.jpg';

  accordion = viewChild.required(MatAccordion);
  ngOnInit(): void {
    this.getUser();
  }

  userSub!: Subscription;
  userService = inject(UsersService);
  route = inject(ActivatedRoute);
  user: User;
  getUser(){
    this.userSub = this.userService.getUserById(this.route.snapshot.params['id']).subscribe(x => {
      this.user = x;
      this.getPersonsalData(x.id);
      this.getAccountData(x.id);
      this.getStatutoryData(x.id);
      this.getPositionData(x.id);
      this.getDocuments(x.id);
      this.getAssets(x.id);
      this.getPayrollLog(x.id);
      this.getMonthlySalary(x.id);
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
      console.log(this.monthlySalary);

    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.puSub?.unsubscribe();
    this.suSub?.unsubscribe();
    this.auSub?.unsubscribe();
    this.posuSub?.unsubscribe();
  }

  private router = inject(Router);
  openPayroll(id: number){
    this.router.navigateByUrl('login/payroll/month-end/payslip/open/'+ id)
  }
}
