import { Routes } from '@angular/router';
import { PagesComponent } from './pages.component';
import { AuthGuard } from '../common/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: PagesComponent,
    children: [
      {path: '', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }, canActivate: [AuthGuard]
      },
      {path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }, canActivate: [AuthGuard]
      },
      {path: 'announcements', loadComponent: () => import('./announcements/announcements.component').then(c => c.AnnouncementsComponent),
        data: { breadcrumb: 'Announcements' }, canActivate: [AuthGuard]
      },

      {
        path: 'role',
        loadComponent: () => import('./role/role.component').then(c => c.RoleComponent),
        data: { breadcrumb: 'Role' }, canActivate: [AuthGuard]
      },
      {
        path: 'users',
        loadChildren: () => import('./users/user.routes').then(c => c.routes),
        data: { breadcrumb: 'Employees' }, canActivate: [AuthGuard]
      },
      {
        path: 'admin-leave',
        loadChildren: () => import('./admin-leave/admin-leave.routes').then(c => c.routes),
        data: { breadcrumb: 'Leave' }, canActivate: [AuthGuard]
      },
      {
        path: 'employee-leave',
        loadChildren: () => import('./employee-leave/employee-leave.routes').then(c => c.routes),
        data: { breadcrumb: 'VIEW LEAVES' }, canActivate: [AuthGuard]
      },
      {
        path: 'addApproval',
        loadComponent: () => import('./add-approval/add-approval.component').then(c => c.AddApprovalComponent),
        data: { breadcrumb: 'Add Approval' }, canActivate: [AuthGuard]
      },
      {
        path: 'viewApproval',
        loadComponent: () => import('./add-approval/view-approval/view-approval.component').then(c => c.ViewApprovalComponent),
        data: { breadcrumb: 'View Approval' }, canActivate: [AuthGuard]
      },
      {
        path: 'viewInvoices/:id',
        loadComponent: () => import('./add-approval/view-invoices/view-invoices.component').then(c => c.ViewInvoicesComponent),
        data: { breadcrumb: 'View Invoices' }, canActivate: [AuthGuard]
      },
      {
        path: 'updatePI/:id',
        loadComponent: () => import('./add-approval/update-pi/update-pi.component').then(c => c.UpdatePIComponent),
        data: { breadcrumb: 'Update PI' }, canActivate: [AuthGuard]
      },


      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.routes').then(p => p.routes),
        data: { breadcrumb: 'Profile' }, canActivate: [AuthGuard]
      },
      {
        path: 'team',
        loadComponent: () => import('./team/team.component').then(c => c.TeamComponent),
        data: { breadcrumb: 'Team' }, canActivate: [AuthGuard]
      },

    ]
  }
];

