import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core'; // useful for typechecking
import dayGridPlugin from '@fullcalendar/daygrid';
import { HttpClient, HttpClientModule } from '@angular/common/http';
@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink,FullCalendarModule, HttpClientModule],
  templateUrl: './leave-request.component.html',
  styleUrls: ['./leave-request.component.scss']
})
export class LeaveRequestComponent {
   // Define the calendarOptions property with the correct type
   calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: [] // You can populate events here
  };

 
}
