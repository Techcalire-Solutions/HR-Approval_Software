import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../common/interfaces/user';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import {MatAccordion, MatExpansionModule} from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserPersonal } from '../../../common/interfaces/user-personal';
import { StatutoryInfo } from '../../../common/interfaces/statutory-info';
import { UserAccount } from '../../../common/interfaces/user-account';
import { UserPosition } from '../../../common/interfaces/user-position';
import { UserDocument } from '../../../common/interfaces/user-document';

@Component({
  selector: 'app-view-user',
  standalone: true,
  imports: [ MatCardModule, MatDividerModule, MatIconModule, DatePipe, UpperCasePipe,     MatButtonModule,
    MatExpansionModule, CommonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,],
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
  user: any;
  getUser(){
    this.userSub = this.userService.getUserById(this.route.snapshot.params['id']).subscribe(x => {
      this.user = x;
      this.getPersonsalData(x.id);
      this.getAccountData(x.id);
      this.getStatutoryData(x.id);
      this.getPositionData(x.id);
      this.getDocuments(x.id);
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

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.puSub?.unsubscribe();
    this.suSub?.unsubscribe();
    this.auSub?.unsubscribe();
    this.posuSub?.unsubscribe();
  }

}
