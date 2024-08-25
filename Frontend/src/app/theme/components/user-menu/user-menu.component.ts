import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { User } from '../../../common/models/user.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [
    RouterModule,
    FlexLayoutModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    CommonModule
  ],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UserMenuComponent implements OnInit {
  public userImage = 'img/users/user.jpg';
  constructor() { }
  user:User[]=[]

  ngOnInit() {

      if(localStorage.getItem('token')){
        const token: any = localStorage.getItem('token')
        this.user = JSON.parse(token)
        // console.log(user)
  
        // let roleid = user.role
        // console.log(roleid);
    }
  

  }

}
