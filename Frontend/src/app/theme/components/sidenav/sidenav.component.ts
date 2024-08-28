import { Component, OnInit, PipeTransform, ViewEncapsulation } from '@angular/core';
import { Settings, SettingsService } from '../../../services/settings.service';
import { MenuService } from '../../../services/menu.service';
import { VerticalMenuComponent } from '../menu/vertical-menu/vertical-menu.component';

import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../common/models/user.model';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../services/users.service';
import { InvoiceService } from '@services/invoice.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    FlexLayoutModule,
    NgScrollbarModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    VerticalMenuComponent,
    CommonModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidenavComponent implements OnInit , PipeTransform{
  transform(value: User[] | null, args?: any): any {
    let searchText = new RegExp(args, 'ig');
    if (value) {
      console.log(value);

      return value.filter(user => {
        if (user.name) {
          return user.name.search(searchText) !== -1;
        }
        else{
          return user.name.search(searchText) !== -1;
        }
      });
    }
  }

  public userImage = 'img/users/default-user.jpg';
  public menuItems: Array<any>;
  public settings: Settings;
  constructor(private router: Router, public settingsService: SettingsService,public invoiceService:InvoiceService, public menuService: MenuService,
    private userService:UsersService
  ){
      this.settings = this.settingsService.settings;
  }
user:any
role: String
roleId:number;
userId :number ;
userJoinedDate : any;
users:User;
  ngOnInit() {
    this.menuItems = this.menuService.getVerticalMenuItems();

    const token = localStorage.getItem('token');
    console.log(token)
    if (token) {
      this.user = JSON.parse(token);
      console.log(this.user)
      console.log(this.user.role);
      this.roleId = this.user.role
      this.userId= this.user.id


      this.invoiceService.getRoleById(this.user.role).subscribe((res)=>{
        console.log(res);

         this.role = res.roleName

    })
  }
  this.userService.getUserById(this.userId).subscribe((res)=>{
    console.log(res)
    // this.userJoinedDate = res;

  })


  this.userService.getUserByRoleId( this.roleId).subscribe((res)=>{
    console.log(res)
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
  // logout(){
  //   const dialogRef = this.dialog.open(LogoutComponent, {
  //     width: '440px',
  //     data: {
  //       id: this.userId,
  //       role: this.userRole
  //     }
  //   });

  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result === true) {
  //       this.router.navigateByUrl('');
  //     }
  //   });
  // }

  public closeSubMenus(){
    let menu = document.getElementById("vertical-menu");
    if(menu){
      for (let i = 0; i < menu.children[0].children.length; i++) {
        let child = menu.children[0].children[i];
        if(child){
          if(child.children[0].classList.contains('expanded')){
              child.children[0].classList.remove('expanded');
              child.children[1].classList.remove('show');
          }
        }
      }
    }
  }

}
