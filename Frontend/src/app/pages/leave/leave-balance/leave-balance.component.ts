/* eslint-disable @typescript-eslint/no-explicit-any */

import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { DragulaModule } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { LeaveType } from '../../../common/interfaces/leaves/leaveType';
import { UsersService } from '@services/users.service';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { NewLeaveService } from '@services/new-leave.service';


@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    DragulaModule,
    CommonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
],
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.scss'
})
export class LeaveBalanceComponent implements OnInit, OnDestroy {

  selectedView: string = 'list';
  public icons = ["home", "person", "alarm", "work", "mail", "favorite"];
  public colors = ["primary", "accent", "warn", "pending"];
  userId: number;

  public leaveCounts: any[] = [];
  public hasLeaveCounts: boolean = false;
  leaveService = inject(NewLeaveService)
  public errorMessage: string | null = null;

  selectedYear: number = new Date().getFullYear(); // Default to current year
  availableYears: number[] = [];

  leaveCountsSubscription: Subscription;
  currentYear: number;
  ngOnInit() {
    const token: any = localStorage.getItem('token');
    const user = JSON.parse(token);
    this.userId = user.id;
    this.getUser()
    this.getLeaveType()
    this.initializeYears()

    this.currentYear = new Date().getFullYear();
  }

  initializeYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  }

  filterLeaves(): void {
    this.leaveCounts = [];
    this.getLeaveType()
  }

  isPermanentUser: boolean = false;
  private readonly userService = inject(UsersService);
  getUser(){
    this.userService.getUserById(this.userId).subscribe(res => {
      this.isPermanentUser = !res.isTemporary
    })
  }

  ltSub!: Subscription;
  leaveTypes: LeaveType[] = [];
  getLeaveType(){
    this.ltSub = this.leaveService.getLeaveType().subscribe(leaveType => {
      this.leaveTypes = leaveType 
      this.fetchLeaveCounts()
    });
  }

  fetchLeaveCounts(): void {
    this.leaveTypes.forEach((leaveType) => {
      this.leaveCountsSubscription = this.leaveService.getLeaveCounts(this.userId, leaveType.id, this.selectedYear).subscribe({
        next: (response) => {
          console.log(response);
          
          this.leaveCounts.push({ ...response, leaveType: leaveType.leaveTypeName });
          console.log(this.leaveCounts);
          
        },
        error: (error) => {
          console.error('Error fetching leave counts:', error);
          // this.errorFlag = true;
          this.errorMessage = 'Failed to fetch leave records';
        },
      });
    });
  }

  shouldDisplayLeaveType(leaveType: LeaveType): boolean {
    return true;
  }

  ngOnDestroy() {
    if (this.leaveCountsSubscription) {
      this.leaveCountsSubscription.unsubscribe();
    }
    this.ltSub?.unsubscribe();
  }

}
