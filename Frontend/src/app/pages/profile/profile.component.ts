import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { User } from '../../common/interfaces/user';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { StatutoryInfo } from '../../common/interfaces/statutory-info';
import { UserAccount } from '../../common/interfaces/user-account';
import { UserDocument } from '../../common/interfaces/user-document';
import { UserPersonal } from '../../common/interfaces/user-personal';
import { UserPosition } from '../../common/interfaces/user-position';
import { UsersService } from '@services/users.service';

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
    UpperCasePipe
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
      let user = JSON.parse(token)
      this.getUser(user.id)
      let roleid = user.role
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

}
