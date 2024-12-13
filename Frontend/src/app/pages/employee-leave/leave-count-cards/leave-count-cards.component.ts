import { Component, ElementRef, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { LeaveService } from '@services/leave.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-leave-count-cards',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './leave-count-cards.component.html',
  styleUrls: ['./leave-count-cards.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LeaveCountCardsComponent {

  @ViewChild('resizedDiv') resizedDiv: ElementRef;
  public leaveCounts: any[] = [];
  public hasLeaveCounts: boolean = false;
  public userId: number;
  public errorMessage: string | null = null;

  leaveService =  inject(LeaveService)
  leaveCountsSubscription: Subscription;

  ngOnInit() {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.userId = user.id;
    this.fetchLeaveCounts();
  }

  fetchLeaveCounts() {
   this.leaveCountsSubscription= this.leaveService.getLeaveCounts(this.userId).subscribe(
      (res) => {
        if (res.userLeaves && res.userLeaves.length > 0) {
          this.leaveCounts = res.userLeaves;
          this.hasLeaveCounts = true;
        } else {
          this.leaveCounts = [];
          this.hasLeaveCounts = false;
          this.errorMessage = 'No leave records found for this user.';
        }
      },
      (error) => {
        this.errorMessage = 'Unable to fetch leave counts.';
        this.hasLeaveCounts = false;
      }
    );
  }

  getLeaveBalance(leave: any): number {
    if (leave.leaveType.leaveTypeName === 'LOP') {
      return leave.takenLeaves;
    } else {
      return Math.max(leave.noOfDays - leave.takenLeaves, 0);
    }
  }

  isLOP(leave: any): boolean {
    return leave.leaveType.leaveTypeName === 'LOP' || leave.leaveBalance === null || leave.leaveBalance < 0;
  }
  
  
  ngOnDestroy() {
    if (this.leaveCountsSubscription) {
      this.leaveCountsSubscription.unsubscribe();
    }
  }

}
