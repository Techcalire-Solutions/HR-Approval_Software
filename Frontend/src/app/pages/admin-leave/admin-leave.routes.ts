import { Routes } from '@angular/router';
import { AdminLeaveComponent } from './admin-leave.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: AdminLeaveComponent, canActivate: [AuthGuard]},
  {
    // /login/admin-leave/userLeave
    path: 'userLeave',
    loadComponent: () => import('./user-leave/user-leave.component').then(c => c.UserLeaveComponent),
    data: { breadcrumb: 'UserLeave' }, canActivate: [AuthGuard]
  },
  {
    path: 'view-leave-request',
    loadComponent: () => import('./view-leave-request/view-leave-request.component').then(c => c.ViewLeaveRequestComponent),
    data: { breadcrumb: 'View Leave Request' }, canActivate: [AuthGuard]
  },
  {
    path: 'leave-types',
    loadComponent: () => import('./leave-types/leave-types.component').then(c => c.LeaveTypesComponent),
    data: { breadcrumb: 'LeaveTypes' }, canActivate: [AuthGuard]
  },
];
