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
import { environment } from '../../../environments/environment';
import { DatePipe } from '@angular/common';

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
    DatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  public userImage = 'img/users/avatar.png';
  apiUrl = 'https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  private loginService = inject(LoginService)

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
    this.userSub = this.loginService.getUserById(id).subscribe(user => {
      this.user = user
    });
  }
}
