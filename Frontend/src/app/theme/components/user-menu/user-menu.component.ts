import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { User } from '../../../common/models/user.model';


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
  user:User
  ngOnInit() {

      if(localStorage.getItem('token')){
        const token: any = localStorage.getItem('token')
        this.user = JSON.parse(token)
        console.log('38',this.user)

        // let roleid = user.role
        console.log('41',this.user.name);
    }


  }

}
