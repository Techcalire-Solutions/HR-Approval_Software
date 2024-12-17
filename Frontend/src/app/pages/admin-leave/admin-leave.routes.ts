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
  {
    path: 'apply-emergency-leave',
    loadComponent: () => import('./apply-emergency-leave/apply-emergency-leave.component').then(c => c.ApplyEmergencyLeaveComponent),
    data: { breadcrumb: 'Apply Emergency Leave' }, canActivate: [AuthGuard]
  },
  {
    path: 'update-emergency-leave',
    loadComponent: () => import('./apply-emergency-leave/apply-emergency-leave.component').then(c => c.ApplyEmergencyLeaveComponent),
    data: { breadcrumb: 'Update Emergency Leave' }, canActivate: [AuthGuard]
  },

  {
    path: 'report',
    loadComponent: () => import('./leave-reports/leave-reports.component').then(c => c.LeaveReportsComponent),
    data: { breadcrumb: 'Reports' }, canActivate: [AuthGuard]
  },
  {
    path: 'compo-off/:id',
    loadComponent: () => import('./add-combooff/add-combooff.component').then(c => c.AddCombooffComponent),
    data: { breadcrumb: 'Compo Off' }, canActivate: [AuthGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./edit-leave/edit-leave.component').then(c => c.EditLeaveComponent),
    data: { breadcrumb: 'Edit' }, canActivate: [AuthGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./view-leave-details/view-leave-details.component').then(c => c.ViewLeaveDetailsComponent),
    data: { breadcrumb: 'View' }, canActivate: [AuthGuard]
  },
];
