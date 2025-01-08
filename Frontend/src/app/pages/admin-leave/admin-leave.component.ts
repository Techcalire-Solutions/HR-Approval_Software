import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CalendarEvent, CalendarEventAction, CalendarModule, CalendarView } from 'angular-calendar';
import { startOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';
// import { blockTransition } from '../../theme/utils/app-animation';
import { Subject, Subscription } from 'rxjs';
import { Settings, SettingsService } from '@services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { LeaveService } from '@services/leave.service';

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
  selector: 'app-admin-leave',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    CalendarModule,
    CommonModule
  ],
  templateUrl: './admin-leave.component.html',
  styleUrl: './admin-leave.component.scss'
})

export class AdminLeaveComponent implements OnInit, OnDestroy {
  view: CalendarView | "month" | "week" | "day" = 'month';
  viewDate: Date = new Date();
  activeDayIsOpen: boolean = true;
  events: CalendarEvent[] = [];


  refresh: Subject<any> = new Subject();

  public settings: Settings;
  leaveService=inject(LeaveService)
  settingsService=inject(SettingsService)
  dialog=inject(MatDialog)
  snackBar=inject(MatSnackBar)





    ngOnInit() {
      this.getLeaves()
      this.settings = this.settingsService.settings;

    }
getLeaveSub : Subscription
  leaves:any[]=[]
  totalItemsCount = 0;

  getLeaves() {
    this.getLeaveSub = this.leaveService.getLeaves().subscribe(
      (res) => {
        console.log(res)
        if (res) {
          this.leaves = res
          this.events = this.mapLeavesToCalendarEvents(this.leaves);
          console.log(this.events)
        }
      },
      (error) => {
        this.snackBar.open('Failed to load leave data', '', { duration: 3000 });
      }
    );
  }



  dayClicked({ date, events }: { date: Date, events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  mapLeavesToCalendarEvents(leaves: any[]): CalendarEvent[] {
    return leaves.map(leave => ({
      id: leave.id,
      user: leave.user.name, // Assuming leave.user.name contains the user's name
      title: `${leave.user.name}: ${leave.leaveType.leaveTypeName} - Reason: ${leave.notes}`, // Concatenating the notes with the user's name
      start: startOfDay(new Date(leave.startDate)), // Assuming leave.startDate is a date string
      end: startOfDay(new Date(leave.endDate)), // Assuming leave.endDate is a date string
      // Add other necessary properties for CalendarEvent
    }));
  }




  openScheduleDialog(event: any) {

  }

  ngOnDestroy(): void{

  }

}
