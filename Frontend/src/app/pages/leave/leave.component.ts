import { Component, inject, OnInit } from '@angular/core';
import { CalendarEvent, CalendarEventAction, CalendarModule, CalendarView } from 'angular-calendar';
import { startOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';
import { blockTransition } from '../../theme/utils/app-animation';
import { Subject, Subscription } from 'rxjs';
import { Settings, SettingsService } from '@services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ScheduleDialogComponent } from './schedule-dialog/schedule-dialog.component';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { LeaveService } from '@services/leave.service';
import { Leave } from '../../common/interfaces/leave';
import { Router } from '@angular/router';
const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    CalendarModule,
    CommonModule
  ],
  templateUrl: './leave.component.html',
  animations: [blockTransition],
  host: {
    '[@blockTransition]': ''
  }
})
export class LeaveComponent implements OnInit {
  router = inject(Router)
  view: CalendarView = CalendarView.Month; // Use enum here
  viewDate: Date = new Date();

  CalendarView = CalendarView; // Expose the CalendarView enum to the template

  events: CalendarEvent[] = [];  // CalendarEvent type
  refresh: Subject<any> = new Subject();
  activeDayIsOpen: boolean = false;
  selectedLeaves: any[] = [];  // To hold leaves for the selected date
  leaveService = inject(LeaveService)
  snackBar = inject(MatSnackBar);
  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // this.fetchLeavesForDate(this.viewDate);  // Fetch initial leaves data
    this.getLeaves()
  }

  // Handle day click event
  dayClicked(day: any): void {
    const clickedDate = day.date;
    this.fetchLeavesForDate(clickedDate);
    this.router.navigate(['/login/view-leave-request'], { queryParams: { date: clickedDate } });
  }

  // Fetch leaves for the clicked date
  fetchLeavesForDate(date: Date): void {
    this.http.get(`/leave/getBydate?date=${date.toISOString()}`).subscribe((response: any) => {
      this.selectedLeaves = response;  // Assume the response contains an array of leaves
    });
  }

  getLeaveSub : Subscription
  leaves:Leave[]=[]
  totalItems = 0;
  getLeaves(){
       this.getLeaveSub= this.leaveService.getLeaves().subscribe((res)=> {
        console.log('res',res);

        this.leaves = res.items;
        this.totalItems = res.count;
        console.log('leaves', this.leaves);
        console.log('totalItems', this.totalItems);

      },
      (error) => {
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      })
  }

  // Approve leave
  approveLeave(leaveId: number): void {
    this.http.post(`/leave/${leaveId}/approve`, {}).subscribe(() => {
      this.refreshLeaves();
    });
  }

  // Reject leave
  rejectLeave(leaveId: number): void {
    this.http.post(`/leave/${leaveId}/reject`, {}).subscribe(() => {
      this.refreshLeaves();
    });
  }

  // Refresh the leaves after approve/reject
  refreshLeaves(): void {
    this.fetchLeavesForDate(this.viewDate);  // Refresh for the current date
  }
}
