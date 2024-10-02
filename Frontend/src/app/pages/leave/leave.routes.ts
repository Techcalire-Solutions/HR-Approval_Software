
import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApplyLeaveComponent } from './apply-leave/apply-leave.component';

export const routes: Routes = [
  { path: '', component: ApplyLeaveComponent, canActivate: [AuthGuard]},

  { path: 'add',  loadComponent: () => import('./add-leave/add-leave.component').then(c => c.AddLeaveComponent),
    data: { breadcrumb: 'Add' } , canActivate: [AuthGuard]
  },
  {
    path: 'leaverequest',
    loadComponent: () => import('./leave-request/leave-request.component').then(c => c.LeaveRequestComponent),
    data: { breadcrumb: 'LeaveRequest' }, canActivate: [AuthGuard]
  },
  {
    path: 'userLeave',
    loadComponent: () => import('./user-leave/user-leave.component').then(c => c.UserLeaveComponent),
    data: { breadcrumb: 'LeaveRequest' }, canActivate: [AuthGuard]
  },

];


