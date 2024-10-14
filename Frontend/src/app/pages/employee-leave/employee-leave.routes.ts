import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';
import { EmployeeLeaveComponent } from './employee-leave.component';

export const routes: Routes = [
  { path: '', component: EmployeeLeaveComponent, canActivate: [AuthGuard]},
  { path: 'add',  loadComponent: () => import('./add-leave/add-leave.component').then(c => c.AddLeaveComponent),
    data: { breadcrumb: 'APPLY LEAVE' } , canActivate: [AuthGuard]
  },
  { path: 'events',  loadComponent: () => import('./emp-events-calender/emp-events-calender.component').then(c => c.EmpEventsCalenderComponent),
    data: { breadcrumb: 'Events' } , canActivate: [AuthGuard]
  },
  { path: 'balance',  loadComponent: () => import('./leave-balance/leave-balance.component').then(c => c.LeaveBalanceComponent),
    data: { breadcrumb: 'Balance' } , canActivate: [AuthGuard]
  },
];
