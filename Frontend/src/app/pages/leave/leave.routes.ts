
import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApplyLeaveComponent } from './apply-leave/apply-leave.component';

export const routes: Routes = [
  { path: '', component: ApplyLeaveComponent, canActivate: [AuthGuard]},

  { path: 'add',  loadComponent: () => import('./add-leave/add-leave.component').then(c => c.AddLeaveComponent),
    data: { breadcrumb: 'Add' } , canActivate: [AuthGuard]
  },
  { path: 'events',  loadComponent: () => import('./emp-events-calender/emp-events-calender.component').then(c => c.EmpEventsCalenderComponent),
    data: { breadcrumb: 'Events' } , canActivate: [AuthGuard]
  },
  {
    path: 'userLeave',
    loadComponent: () => import('./user-leave/user-leave.component').then(c => c.UserLeaveComponent),
    data: { breadcrumb: 'LeaveRequest' }, canActivate: [AuthGuard]
  },
  {
    path: 'leaveCalendar',
    loadComponent: () => import('./leave.component').then(c => c.LeaveComponent),
    data: { breadcrumb: 'Calender View' }, canActivate: [AuthGuard]
  },

];


