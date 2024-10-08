
import { AddLeaveComponent } from '../../employee-leave/add-leave/add-leave.component';
import { Component, OnInit } from '@angular/core';
import { CalendarEvent, CalendarEventAction, CalendarModule, CalendarView } from 'angular-calendar';
import { startOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';
// import { blockTransition } from '../../theme/utils/app-animation';
 import { blockTransition } from '../../../theme/utils/app-animation';
import { Subject } from 'rxjs';
import { Settings, SettingsService } from '@services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
// import { ScheduleDialogComponent } from './schedule-dialog/schedule-dialog.component';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  selector: 'app-emp-events-calender',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    CalendarModule
  ],
  templateUrl: './emp-events-calender.component.html',
  styleUrl: './emp-events-calender.component.scss',
  animations: [blockTransition],
  host: {
    '[@blockTransition]': ''
  }
})
export class EmpEventsCalenderComponent {

  view: CalendarView | "month" | "week" | "day" = 'month';
  viewDate: Date = new Date();
  activeDayIsOpen: boolean = true;
  actions: CalendarEventAction[] = [{
    label: '<i class="material-icons icon-sm white">edit</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      this.openScheduleDialog(event);
    }
  }, {
    label: '<i class="material-icons icon-sm white">close</i>',
    onClick: ({ event }: { event: CalendarEvent }): void => {
      this.events = this.events.filter(iEvent => iEvent !== event);
      this.snackBar.open('Event deleted successfully!', undefined, {
        duration: 1500
      });
    }
  }];
  events: CalendarEvent[] = [
  //   {
  //   start: subDays(startOfDay(new Date()), 1),
  //   end: addDays(new Date(), 1),
  //   title: 'Add Leave',
  //   color: colors.red,
  //   actions: this.actions
  // },
  // {
  //   start: subDays(startOfDay(new Date()), 1),
  //   end: addDays(new Date(), 1),
  //   title: 'A 3 day event',
  //   color: colors.red,
  //   actions: this.actions
  // }, {
  //   start: startOfDay(new Date()),
  //   title: 'An event with no end date',
  //   color: colors.yellow,
  //   actions: this.actions
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
  //   actions: this.actions,
  //   resizable: {
  //     beforeStart: true,
  //     afterEnd: true
  //   },

  //   draggable: true
  // }
];
  refresh: Subject<any> = new Subject();

  public settings: Settings;
  constructor(public settingsService: SettingsService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar) {
    this.settings = this.settingsService.settings;
  }

  ngOnInit() {
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

  openScheduleDialog(event: any) {
    let dialogRef = this.dialog.open(AddLeaveComponent, {
      data: event
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (!result.isEdit) {
          result.color = colors.blue;
          result.actions = this.actions;
          this.events.push(result);
          this.refresh.next(null);
        } else {
          //implement edit here
        }
      }
    });
  }

}
