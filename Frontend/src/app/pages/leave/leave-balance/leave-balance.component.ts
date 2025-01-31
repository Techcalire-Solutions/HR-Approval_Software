/* eslint-disable @typescript-eslint/no-explicit-any */

import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { LeaveService } from '@services/leave.service';
import { DragulaModule } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { LeaveType } from '../../../common/interfaces/leaves/leaveType';


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
],
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.scss'
})
export class LeaveBalanceComponent implements OnInit, OnDestroy {

  selectedView: string = 'list';
  public icons = ["home", "person", "alarm", "work", "mail", "favorite"];
  public colors = ["primary", "accent", "warn"];
  userId: number;

  public leaveCounts: any[] = [];
  public hasLeaveCounts: boolean = false;
  leaveService = inject(LeaveService)
  public errorMessage: string | null = null;

  leaveCountsSubscription: Subscription;
  ngOnInit() {
    const token: any = localStorage.getItem('token');
    const user = JSON.parse(token);
    this.userId = user.id;
    this.getLeaveType()
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
      this.leaveCountsSubscription = this.leaveService.getLeaveCounts(this.userId, leaveType.id).subscribe({
        next: (response) => {
          this.leaveCounts.push({ ...response, leaveType: leaveType.leaveTypeName });
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
