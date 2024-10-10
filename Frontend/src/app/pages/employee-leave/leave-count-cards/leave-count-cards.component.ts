import { Component, ElementRef, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { Settings, SettingsService } from '@services/settings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { LeaveService } from '@services/leave.service';
import { UsersService } from '@services/users.service';

@Component({
  selector: 'app-leave-count-cards',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    NgxChartsModule
  ],
  templateUrl: './leave-count-cards.component.html',
  styleUrls: ['./leave-count-cards.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LeaveCountCardsComponent {

  public colorScheme: any = {
    domain: ['#999']
  };
  public autoScale = true;

  @ViewChild('resizedDiv') resizedDiv: ElementRef;
  public previousWidthOfResizedDiv: number = 0;
  public settings: Settings;
  leaveService = inject(LeaveService);
  userService = inject(UsersService);

  leaveCounts: any[] = [];
  hasLeaveCounts: boolean = false;
  userId: number;
  errorMessage: string | null = null;

  constructor(public settingsService: SettingsService) {
    this.settings = this.settingsService.settings;
  }

  ngOnInit() {
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    this.userId = user.id;

    // Check if user is in probation
    this.checkProbationAndGetLeaveCounts(this.userId);
  }

  checkProbationAndGetLeaveCounts(userId: number) {
    this.userService.getProbationEmployees().subscribe(
      (probationList) => {
        const isUserOnProbation = probationList.some((probationUser: any) => probationUser.id === userId);

        // If user is NOT on probation, fetch leave counts
        if (!isUserOnProbation) {
          this.fetchLeaveCounts(userId);
        } else {
          // If user is on probation, only show LOP
          this.leaveCounts = [{ leaveTypeName: 'LOP', leaveBalance: 0 }];
          this.hasLeaveCounts = true;
        }
      },
      (error) => {
        this.errorMessage = 'Unable to verify probation status.';
      }
    );
  }

  fetchLeaveCounts(userId: number) {
    this.leaveService.getLeaveCounts(userId).subscribe(
      (res) => {
        console.log('Leave records response:', res);  // Debugging line

        // Check if userLeaves exists and has records
        if (res && res.userLeaves && res.userLeaves.length > 0) {
          this.leaveCounts = res.userLeaves;
          this.hasLeaveCounts = true;
        } else {
          this.leaveCounts = [];
          this.hasLeaveCounts = false;
          this.errorMessage = 'No leave records found for this user.';
        }
      },
      (error) => {
        console.error('Error fetching leave records:', error);  // Debugging line
        this.errorMessage = 'Unable to fetch leave counts.';
        this.hasLeaveCounts = false;
      }
    );
  }



  // Calculate the leave balance based on leave type
  getLeaveBalance(leave: any): number {
    if (leave.leaveTypeName === 'LOP') {
      return leave.takenLeaves;  // For LOP, return taken leaves
    } else {
      return Math.max(leave.noOfDays - leave.takenLeaves, 0);  // For other leave types, show balance
    }
  }

  ngOnDestroy() {
    // Any cleanup if needed
  }
}
