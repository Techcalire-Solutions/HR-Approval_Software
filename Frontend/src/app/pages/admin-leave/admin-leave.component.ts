import { Component, inject, OnInit } from '@angular/core';
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
import { Router } from '@angular/router';
import { Leave } from '../../common/interfaces/leave';

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

export class AdminLeaveComponent {
  view: CalendarView | "month" | "week" | "day" = 'month';
  viewDate: Date = new Date();
  activeDayIsOpen: boolean = true;
  events: CalendarEvent[] = [];
  // actions: CalendarEventAction[] = [{
  //   label: '<i class="material-icons icon-sm white">edit</i>',
  //   onClick: ({ event }: { event: CalendarEvent }): void => {
  //     this.openScheduleDialog(event);
  //   }
  // }, {
  //   label: '<i class="material-icons icon-sm white">close</i>',
  //   onClick: ({ event }: { event: CalendarEvent }): void => {
  //     this.events = this.events.filter(iEvent => iEvent !== event);
  //     this.snackBar.open('Event deleted successfully!', undefined, {
  //       duration: 1500
  //     });
  //   }
  // }];
  // events: CalendarEvent[] = [{
  //   start: subDays(startOfDay(new Date()), 1),
  //   end: addDays(new Date(), 1),
  //   title: 'A 3 day event',
  //   color: colors.red,
  //   // actions: this.actions
  // }, {
  //   start: startOfDay(new Date()),
  //   title: 'An event with no end date',
  //   color: colors.yellow,
  //   // actions: this.actions
  // }, {
  //   start: subDays(endOfMonth(new Date()), 3),
  //   end: addDays(endOfMonth(new Date()), 3),
  //   title: 'A long event that spans 2 months',
  //   color: colors.blue
  // }, {
  //   start: addHours(startOfDay(new Date()), 2),
  //   end: new Date(),
  //   title: 'A draggable and resizable event',
  //   color: colors.yellow,
  //   // actions: this.actions,
  //   resizable: {
  //     beforeStart: true,
  //     afterEnd: true
  //   },
  //   draggable: true
  // }];


  refresh: Subject<any> = new Subject();

  public settings: Settings;
  leaveService=inject(LeaveService)
  settingsService=inject(SettingsService)
  dialog=inject(MatDialog)
  snackBar=inject(MatSnackBar)





    ngOnInit() {
      this.getLeaves()
      this.settings = this.settingsService.settings;
      // Fetch leaves from your service or however you're getting them
      // const leaves: Leave[] = [
      //   {
      //     id: 4,
      //     notes: 'Emergency',
      //     startDate: startOfDay(new Date()),
      //   },
      //   // Add other leave objects here...
      // ];

      // Convert leaves to CalendarEvent[]

    }
getLeaveSub : Subscription
  leaves:any[]=[]
  totalItemsCount = 0;
  getLeaves() {
    this.getLeaveSub = this.leaveService.getLeaves().subscribe(
      (res) => {
        if(res.leave){
          this.leaves = res.leave;
          this.totalItemsCount = res.length;
          this.events = this.mapLeavesToCalendarEvents(this.leaves);
        }

      },
      (error) => {
        // Handle any errors
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
    // let dialogRef = this.dialog.open(ScheduleDialogComponent, {
    //   data: event
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     if (!result.isEdit) {
    //       result.color = colors.blue;
    //       result.actions = this.actions;
    //       this.events.push(result);
    //       this.refresh.next(null);
    //     } else {
    //       //implement edit here
    //     }
    //   }
    // });
  }

}
