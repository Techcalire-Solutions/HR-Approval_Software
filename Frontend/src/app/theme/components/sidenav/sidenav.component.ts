/* eslint-disable @typescript-eslint/no-wrapper-object-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnInit, PipeTransform, ViewEncapsulation } from '@angular/core';
import { Settings, SettingsService } from '../../../services/settings.service';
import { VerticalMenuComponent } from '../menu/vertical-menu/vertical-menu.component';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgScrollbarModule } from 'ngx-scrollbar';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '@services/invoice.service';
import { Menu } from '../../../common/models/menu.model';
import { LoginService } from '@services/login.service';
import { Subscription } from 'rxjs';
import { User } from '../../../common/interfaces/users/user';
import { MenuService } from '@services/menu.service';
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
  url = 'https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/';
  transform(value: User[] | null, args?: any): any {
    const searchText = new RegExp(args, 'ig');
    if (value) {

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

user:any
role: string
roleId:number;
userId :number ;
userJoinedDate : any;
users:User;
// menuItems: Menu[] = [];
  filteredMenuItems: Menu[] = [];
  private invoiceService = inject(InvoiceService);
  private settingsService = inject(SettingsService);
  ngOnInit() {
    this.settings = this.settingsService.settings;
    const token = localStorage.getItem('token');
    if (token) {
      const user = JSON.parse(token);
      this.roleId = user.role;
      this.userId = user.id;
      this.getUser()
    }
  }

  ngOnDestroy():void{
    this.loginUserSub.unsubscribe()
  }

  loginUserSub:Subscription
  getUser() {
    this.loginUserSub = this.loginService.getUserById(this.userId).subscribe((res) => {
      this.user = res;
      if (!this.user.userPosition || !this.user.userPosition.designation) {
        this.invoiceService.getRoleById(this.roleId).subscribe((roleRes) => {
          this.role = roleRes.roleName;
          this.filterMenuItemsByRole(this.role);
        });
      } else {
        if(this.user.userPosition.designation.roleId){
          this.role = this.user.userPosition.designation.role.roleName;
        }else this.role = this.user.userPosition.designation.designationName;
        this.filterMenuItemsByRole(this.role);
      }
    });
  }

  private menuService = inject(MenuService);
  filterMenuItemsByRole(role: string) {
    const allMenuItems = this.menuService.getVerticalMenuItems();
    if (role === 'Administrator'){
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Proforma' && !item.parentId) ||
        (item.title === 'View' && item.parentId === 5)||
        (item.title === 'Reports' && !item.parentId) ||
        (item.title === 'Proforma' && item.parentId === 21) ||
        (item.title === 'View' && item.parentId === 22) ||
        (item.title === 'Excel' && item.parentId === 22) ||

        (item.title === 'Expense' && item.parentId === 21)||
        (item.title === 'View' && item.parentId === 24) ||
        (item.title === 'Excel' && item.parentId === 24)

      );
    } else if (role === 'HR Administrator') {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Employee' && !item.parentId) ||
        (item.title === 'Directory' && item.parentId === 3) ||
        (item.title === 'Confirmation' && item.parentId === 3)||

        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Advance Salary' && item.parentId === 13) ||
        (item.title === 'Month End' && item.parentId === 13) ||
        (item.title === 'Payslip' && item.parentId === 13) ||
        (item.title === 'Process Payslip' && item.parentId === 13) ||

        (item.title === 'Expense' && !item.parentId) ||
        (item.title === 'Add' && item.parentId === 26) ||
        (item.title === 'View' && item.parentId === 26)||
        item.title === 'Backup' ||
        (item.title === 'Leave' && !item.parentId) ||
        (item.title === 'Calendar' && item.parentId === 8) ||
        (item.title === 'View' && item.parentId === 8) ||
        (item.title === 'User Leave' && item.parentId === 8) ||
        (item.title === 'Emergency' && item.parentId === 8)

      );
    } else if (role === 'Super Administrator') {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Employee' && !item.parentId) ||
        (item.title === 'Directory' && item.parentId === 3) ||
        (item.title === 'Confirmation' && item.parentId === 3) ||
        (item.title === 'Proforma' && !item.parentId) ||
        (item.title === 'View' && item.parentId === 5) ||

        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Advance Salary' && item.parentId === 13) ||
        (item.title === 'Month End' && item.parentId === 13) ||
        (item.title === 'Payslip' && item.parentId === 13) ||
        (item.title === 'Process Payslip' && item.parentId === 13) ||
        (item.title === 'Leave' && !item.parentId) ||
        (item.title === 'Calendar' && item.parentId === 8) ||
        (item.title === 'View' && item.parentId === 8) ||
        (item.title === 'Emergency' && item.parentId === 8) ||


        (item.title === 'Reports' && !item.parentId) ||
        (item.title === 'Proforma' && item.parentId === 21) ||
        (item.title === 'View' && item.parentId === 22) ||
        (item.title === 'Excel' && item.parentId === 22) ||

        (item.title === 'Expense' && item.parentId === 21)||
        (item.title === 'View' && item.parentId === 24) ||
        (item.title === 'Excel' && item.parentId === 24)||

        (item.title === 'YTD' && item.parentId === 21)||
        // (item.title === 'Leave Report' && item.parentId === 21)

        item.title === 'Backup'
      );

    } else if ( role === 'Accountant' ) {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Proforma' && !item.parentId) ||
        (item.title === 'View' && item.parentId === 5) ||
        (item.title === 'Excel' && item.parentId === 5) ||

        (item.title === 'Expense' && !item.parentId) ||
        (item.title === 'Add' && item.parentId === 26) ||
        (item.title === 'View' && item.parentId === 26) ||

        (item.title === 'Reports' && !item.parentId) ||
        (item.title === 'Proforma' && item.parentId === 21) ||
        (item.title === 'View' && item.parentId === 22) ||
        (item.title === 'Excel' && item.parentId === 22) ||

        (item.title === 'Expense' && item.parentId === 21)||
        (item.title === 'View' && item.parentId === 24) ||
        (item.title === 'Excel' && item.parentId === 24)||

        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Advance Salary' && item.parentId === 13) ||
        (item.title === 'Month End' && item.parentId === 13) ||
        (item.title === 'Payslip' && item.parentId === 13) ||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Apply Leave' && item.parentId === 8) ||
        (item.title === 'Leave Balance' && item.parentId === 8)
        // (item.title === 'Payroll' && !item.parentId) ||
        // (item.title === 'Advance Salary' && item.parentId === 13) ||
        // (item.title === 'Payslip' && item.parentId === 13) ||
        // (item.title === 'Pay Details' && item.parentId === 13)

      );
    } else if ( role === 'Sales Executive' || role === 'Key Account Manager' || role === 'Manager' || role === 'Team Lead') {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Proforma' && !item.parentId) ||
        (item.title === 'View' && item.parentId === 5)||
        (item.title === 'Add' && item.parentId === 5) ||
        (item.title === 'Expense' && !item.parentId) ||
        (item.title === 'Add' && item.parentId === 26) ||
        (item.title === 'View' && item.parentId === 26) ||

        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Advance Salary' && item.parentId === 13) ||
        (item.title === 'Payslip' && item.parentId === 13) ||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Apply Leave' && item.parentId === 8) ||
        (item.title === 'Leave Balance' && item.parentId === 8)


      )
    }
    else if (role === 'Employee') {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Apply Leave' && item.parentId === 8) ||
        (item.title === 'Leave Balance' && item.parentId === 8)

      );

    }

    else {
      this.filteredMenuItems = allMenuItems.filter(item =>
        item.title === 'Dashboard' ||

        (item.title === 'Payroll' && !item.parentId) ||
        (item.title === 'Advance Salary' && item.parentId === 13) ||
        (item.title === 'Payslip' && item.parentId === 13) ||
        (item.title === 'Expense' && !item.parentId) ||
        (item.title === 'Add' && item.parentId === 26) ||
        (item.title === 'View' && item.parentId === 26)||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Leave' && !item.parentId)||
        (item.title === 'Apply Leave' && item.parentId === 8) ||
        (item.title === 'Leave Balance' && item.parentId === 8)



      )};
  }

  private router = inject(Router);
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('JWT_TOKEN');
    localStorage.removeItem('REFRESH_TOKEN');
    localStorage.removeItem('token');
    sessionStorage.clear();
    this.router.navigate(['/']);
  }

  public closeSubMenus(){
    const menu = document.getElementById("vertical-menu");
    if(menu){
      for (let i = 0; i < menu.children[0].children.length; i++) {
        const child = menu.children[0].children[i];
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
    this.router.navigateByUrl('login/profile')
  }

  openChat(){
    this.router.navigateByUrl('login/chat')
  }

}


