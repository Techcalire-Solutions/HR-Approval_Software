import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { InvoiceService } from '@services/invoice.service';
import { environment } from '../../../../environments/environment';
import { LoginService } from '@services/login.service';


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
 url = environment.apiUrl;

  constructor(private router:Router,private invoiceService:InvoiceService) { }
  loginService = inject(LoginService)

  user:any
  role:any;
  ngOnInit() {
    if(localStorage.getItem('token')){
      const token: any = localStorage.getItem('token')


      if (token) {
        let user = JSON.parse(token);

        this.getUser(user.id)
        this.getRole(user.role)
      }
    }
  }

  getUser(id: number){
    this.loginService.getUserById(id).subscribe((res)=>{
      this.user = res;


    })
  }

  getRole(id: number){
    this.invoiceService.getRoleById(id).subscribe((res)=>{
      this.role = res.roleName
    })
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
