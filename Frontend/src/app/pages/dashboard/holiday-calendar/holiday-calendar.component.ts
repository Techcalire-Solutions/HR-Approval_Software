import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LeaveService } from '@services/leave.service';
import { Subscription } from 'rxjs';
import { Holidays } from '../../../common/interfaces/leaves/holidays';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RoleService } from '@services/role.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [MatCardModule, MatPaginatorModule, MatIconModule, MatChipListbox, MatChipOption, CommonModule],
  templateUrl: './holiday-calendar.component.html',
  styleUrl: './holiday-calendar.component.scss'
})
export class HolidayCalendarComponent implements OnInit, OnDestroy{

  leaveService = inject(LeaveService);
  roleService = inject(RoleService);
  dialog = inject(MatDialog);
  router = inject(Router);
  ngOnInit(): void {
    this.getHolidaysForYear();

    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    let roleId = user.role
    this.getRoleById(roleId)
  }

  roleSub!: Subscription;
  roleName: string = '';
  getRoleById(id: number){
    this.roleSub = this.roleService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;
    })
  }

  holidaySub!: Subscription;
  holidays: Holidays[] = [];
  getHolidaysForYear(): void {
    this.holidaySub = this.leaveService.getHolidays(this.searchText, this.currentPage, this.pageSize).subscribe((res: any) => {
      console.log(res);

      this.holidays = res.items
      this.totalItems = res.count;
    })
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pageSize = 5;
  currentPage = 1;
  totalItems: number;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getHolidaysForYear();
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getHolidaysForYear()
  }


  ngOnDestroy(): void {
    this.holidaySub?.unsubscribe();
  }

  openCompoOff(id: number){
    this.router.navigateByUrl('/login/admin-leave/compo-off/'+id)
  }

}
