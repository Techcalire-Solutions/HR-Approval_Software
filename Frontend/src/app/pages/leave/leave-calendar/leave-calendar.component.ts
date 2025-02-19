import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NewLeaveService } from '@services/new-leave.service';
import { Settings, SettingsService } from '@services/settings.service';
import { CalendarView, CalendarEvent, CalendarModule } from 'angular-calendar';
import { isSameMonth, isSameDay, startOfDay } from 'date-fns';
import { Subject, Subscription } from 'rxjs';
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
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [    FlexLayoutModule, MatCardModule, MatButtonModule, MatIconModule, CalendarModule, CommonModule],
  templateUrl: './leave-calendar.component.html',
  styleUrl: './leave-calendar.component.scss'
})
export class LeaveCalendarComponent {
  view: CalendarView | "month" | "week" | "day" = 'month';
  viewDate: Date = new Date();
  activeDayIsOpen: boolean = true;
  events: CalendarEvent[] = [];


  refresh: Subject<any> = new Subject();

  public settings: Settings;
  private readonly leaveService = inject(NewLeaveService)
  private readonly settingsService=inject(SettingsService)
  private readonly dialog=inject(MatDialog)
  private readonly snackBar=inject(MatSnackBar)
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
        if (res) {
          this.leaves = res.filter((leave: any) => leave.status === 'Approved' || leave.status === 'AdminApproved');
          this.events = this.mapLeavesToCalendarEvents(this.leaves);
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
    this.getLeaveSub?.unsubscribe();
  }

}
