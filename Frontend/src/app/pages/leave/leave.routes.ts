import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
  { path: '',
    children: [
      {
        path: '', loadComponent: () => import('./leave.component').then(c => c.LeaveComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'open/:id', loadComponent: () => import('./open-leave/open-leave.component').then(c => c.OpenLeaveComponent),
        canActivate: [AuthGuard], data: { breadcrumb: 'Open'}
      },
      { path: 'add',  loadComponent: () => import('./apply-leave/apply-leave.component').then(c => c.ApplyLeaveComponent),
        data: { breadcrumb: 'ADD' } , canActivate: [AuthGuard]
      },
      { path: 'edit/:id',  loadComponent: () => import('./apply-leave/apply-leave.component').then(c => c.ApplyLeaveComponent),
        data: { breadcrumb: 'EDIT' } , canActivate: [AuthGuard]
      },
      // { path: 'viewlogs',  loadComponent: () => import('./advance-salary/view-log/view-log.component').then(c => c.ViewLogComponent),
      //   data: { breadcrumb: 'LOGS' } , canActivate: [AuthGuard]
      // },
    ]
  },
  {
    path: 'leave-calendar',
    data: { breadcrumb: 'Calendar' },
    children: [
      {
        path: '',
        loadComponent: () => import('./leave-calendar/leave-calendar.component').then(c => c.LeaveCalendarComponent),
        canActivate: [AuthGuard]
      },
    ]
  },
  {
    path: 'leave-balance',
    data: { breadcrumb: 'Balance' },
    children: [
      {
        path: '',
        loadComponent: () => import('./leave-balance/leave-balance.component').then(c => c.LeaveBalanceComponent),
        canActivate: [AuthGuard]
      },
    ]
  },
  {
    path: 'leave-report',
    data: { breadcrumb: 'Report' },
    children: [
      {
        path: '',
        loadComponent: () => import('./leave-reports/leave-reports.component').then(c => c.LeaveReportsComponent),
        canActivate: [AuthGuard]
      },
    ]
  },
];
