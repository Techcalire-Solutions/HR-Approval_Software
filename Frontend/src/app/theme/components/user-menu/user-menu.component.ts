import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { User } from '../../../common/models/user.model';
import { InvoiceService } from '@services/invoice.service';


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
 public userImage = 'img/users/default-user.jpg';


  constructor(private router:Router,private invoiceService:InvoiceService) { }
  user:any
  role:any;
  ngOnInit() {

      if(localStorage.getItem('token')){
        const token: any = localStorage.getItem('token')
        this.user = JSON.parse(token)
        console.log('38',this.user)
      
    if (token) {
      this.user = JSON.parse(token);
      console.log(this.user)
      console.log(this.user.role);

        // let roleid = user.role
        console.log('41',this.user.name);
    }
    this.invoiceService.getRoleById(this.user.role).subscribe((res)=>{
      console.log(res);

       this.role = res.roleName

  })
  }


  }
  logout() {
    // Clear authentication tokens or session data here
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('JWT_TOKEN');
    localStorage.removeItem('REFRESH_TOKEN');
    sessionStorage.clear(); // Clear all session storage if needed
    this.router.navigate(['/']);
  }

}
