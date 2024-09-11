import { Component, inject, OnInit, PipeTransform, ViewEncapsulation } from '@angular/core';
import { Settings, SettingsService } from '../../../services/settings.service';
import { MenuService } from '../../../services/menu.service';
import { VerticalMenuComponent } from '../menu/vertical-menu/vertical-menu.component';
import { ChangeDetectorRef } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../../services/users.service';
import { InvoiceService } from '@services/invoice.service';
import { Router } from '@angular/router';
import { Menu } from '../../../common/models/menu.model';
import { environment } from '../../../../environments/environment';
import { LoginService } from '@services/login.service';
import { User } from '../../../common/interfaces/user';

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
  url = environment.apiUrl;
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
  loginService = inject(LoginService);
  constructor(private cdr: ChangeDetectorRef, private router: Router, public settingsService: SettingsService,public invoiceService:InvoiceService, public menuService: MenuService,
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
// menuItems: Menu[] = [];
  filteredMenuItems: Menu[] = [];

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      let user = JSON.parse(token);
      this.roleId = user.role;
      this.userId = user.id;
      this.getUser()
      this.invoiceService.getRoleById(user.role).subscribe((res) => {
        this.role = res.roleName;
        this.filterMenuItemsByRole(res.roleName);
      });
    }
  }

  getUser(){
    this.loginService.getUserById(this.userId).subscribe((res)=>{
      this.user = res;
      console.log(this.user);

    })
  }

  filterMenuItemsByRole(role: string) {
    console.log("Filtering menus for role:", role);

    const allMenuItems = this.menuService.getVerticalMenuItems();

    if (role === 'Administrator') {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        item.title === 'Role' ||
        item.title === 'User' ||
        item.title === 'Team' ||

        (item.title === 'Approval Uploads' && !item.parentId) ||
        (item.title === 'View' && item.parentId === 5) ||
        (item.title === 'Leave' && !item.parentId) ||
        (item.title === 'Leave Request' && item.parentId === 8) ||
        (item.title === 'Emergency Leave' && item.parentId === 8) ||
        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Process Payroll' && item.parentId === 13) ||
        (item.title === 'Salary Statement' && item.parentId === 13) || 
        (item.title === 'YTD Reports' && item.parentId === 13)

      
      );
    } else if (
      role === 'Sales Executive' ||
      role === 'Key Account Manager' ||
      role === 'Manager' ||
      role === 'Team Lead' ||
      role === 'Accountant' 
    ) {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Approval Uploads' && !item.parentId) ||
        (item.title === 'Add' && item.parentId === 5) ||
        (item.title === 'View' && item.parentId === 5) ||
        (item.title === 'Leave' && !item.parentId) ||
        (item.title === 'Apply leave' && item.parentId === 8) ||
        (item.title === 'Leave Balance' && item.parentId === 8) || 
        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Payslip' && item.parentId === 13) ||
        (item.title === 'Pay Details' && item.parentId === 13) 
        
      );
    } else {
      this.filteredMenuItems = [];
    }

    console.log("Filtered menu items:", this.filteredMenuItems);
  }






  logout() {
    // console.log();

    // Clear authentication tokens or session data here
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('JWT_TOKEN');
    localStorage.removeItem('REFRESH_TOKEN');
    localStorage.removeItem('token');
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

  openProfile(){
    console.log("jjjjjjjjjjjjjjjjjjjjjjjjjj");

    this.router.navigateByUrl('login/profile')
  }

}
