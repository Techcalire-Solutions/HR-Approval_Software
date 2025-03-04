import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { InfoCardsComponent } from './info-cards/info-cards.component';
import { MatrixTableComponent } from "./matrix-table/matrix-table.component";
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { BirthdayComponent } from "./birthday/birthday.component";
import { JoiningDayComponent } from "./joining-day/joining-day.component";
import { ProbationDueComponent } from "./probation-due/probation-due.component";
import { HolidayCalendarComponent } from "./holiday-calendar/holiday-calendar.component";
import { LeaveRequestsNotificationComponent } from './leave-requests-notification/leave-requests-notification.component';
import { UsersService } from '@services/users.service';
import { RoleService } from '@services/role.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    InfoCardsComponent,
    MatrixTableComponent,
    BirthdayComponent,
    JoiningDayComponent,
    ProbationDueComponent,
    HolidayCalendarComponent,
    LeaveRequestsNotificationComponent,
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  invoiceService = inject(InvoiceService)
  user: number;
  ngOnInit(){
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)

    this.user = user.id;

    const roleId = user.role
    this.getRoleById(roleId)
    this.getUsers()
  }
  roleSub!: Subscription;
  roleName!: string;
  hradmin: boolean = false;
  payStat: boolean = false;
  private roleService = inject(RoleService);
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;      
      console.log(this.roleName);     
      if(this.roleName != 'HR Administrator' && this.roleName !=='Super Administrator' && this.roleName !== 'Administrator') {
        this.roleService.getDesignationbyRole(role.id).subscribe(res =>{
          if(res.length > 0){
            this.payStat = true;
          }
        });
      }
    })
  }

  private readonly userService = inject(UsersService);
  userSub!: Subscription;
  rm: boolean = false;
  getUsers(){
    this.userSub = this.userService.getUserPersonalDetails().subscribe(users => {
      let rmUsers = users.filter(user => user.reportingMangerId === this.user)
      if(rmUsers.length > 0){
        this.rm = true;
      }
    })
  }
}
