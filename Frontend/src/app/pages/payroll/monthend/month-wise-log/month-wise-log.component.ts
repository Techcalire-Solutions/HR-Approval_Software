/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { PayrollService } from '@services/payroll.service';
import { RoleService } from '@services/role.service';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-month-wise-log',
  standalone: true,
  imports: [MatPaginatorModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule],
  templateUrl: './month-wise-log.component.html',
  styleUrl: './month-wise-log.component.scss'
})
export class MonthWiseLogComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.monthLogSub?.unsubscribe();
    this.roleSub?.unsubscribe();
  }

  ngOnInit(): void {
    const token: any = localStorage.getItem('token')
    const user = JSON.parse(token)
    this.getRoleById(user.role, user.id)
  }

  private roleService = inject(RoleService);
  private roleSub!: Subscription;
  getRoleById(id: number, userId: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe(role => {
      if(role.roleName === 'Super Administrator' || role.roleName === 'HR Administrator'){  
        this.getMonthlyLog();
      }else{
        this.getUserById(userId)
      }
    });
  }

  private usersService = inject(UsersService);
  private userSub!: Subscription;
  admin: boolean = true;
  id: number = 0;
  getUserById(id: number){
    this.userSub = this.usersService.getUserById(id).subscribe(user => {
      if(!user.userPosition || 
      (user.userPosition && user.userPosition.designation?.designationName !== 'FINANCE MANAGER')){
        this.admin = false;
        this.id = id;
        this.getMonthlyLogByUser(id)
      }else{
        this.getMonthlyLog()
      }
    });
  }

  payrollService = inject(PayrollService);
  logs: any[] = [];
  getMonthlyLog(){
    this.monthLogSub = this.payrollService.getMonthlyPayroll(this.searchText, this.currentPage, this.pageSize).subscribe(data =>{
      this.logs = data.items
      this.totalItems = data.count;
    });
  }

  monthLogSub!: Subscription;
  getMonthlyLogByUser(id: number){
    this.monthLogSub = this.payrollService.getMonthlyPayrollByUser(id, this.searchText, this.currentPage, this.pageSize).subscribe(data =>{
      this.logs = data.items
      this.totalItems = data.count;
    });
  }

  private router = inject(Router);
  openPayroll(id: number){
    this.router.navigateByUrl('login/payroll/month-end/payslip/open/'+ id)
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim();
    if(this.admin) {
      this.getMonthlyLog()
    }
    else {
      this.getMonthlyLogByUser(this.id);
    }
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 20;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    if(this.admin) {
      this.getMonthlyLog()
    }
    else {
      this.getMonthlyLogByUser(this.id);
    }
  }

}
