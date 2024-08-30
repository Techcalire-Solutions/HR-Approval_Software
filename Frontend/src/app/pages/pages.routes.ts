import { Routes } from '@angular/router';
import { PagesComponent } from './pages.component';

export const routes: Routes = [
  { path: '', component: PagesComponent,
    children: [
      {path: '', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }
      },
      {path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }
      },

      {
        path: 'role',
        loadComponent: () => import('./role/role.component').then(c => c.RoleComponent),
        data: { breadcrumb: 'Role' }
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(c => c.UsersComponent),
        data: { breadcrumb: 'Users' }
      },
      {
        path: 'addApproval',
        loadComponent: () => import('./add-approval/add-approval.component').then(c => c.AddApprovalComponent),
        data: { breadcrumb: 'Add Approval' }
      },
      {
        path: 'viewApproval',
        loadComponent: () => import('./add-approval/view-approval/view-approval.component').then(c => c.ViewApprovalComponent),
        data: { breadcrumb: 'Add Approval' }
      },
      {
        path: 'viewInvoices/:id',
        loadComponent: () => import('./add-approval/view-invoices/view-invoices.component').then(c => c.ViewInvoicesComponent),
        data: { breadcrumb: 'View Invoices' }
      },
      {
        path: 'updatePI/:id',
        loadComponent: () => import('./add-approval/update-pi/update-pi.component').then(c => c.UpdatePIComponent),
        data: { breadcrumb: 'Update PI' }
      },


      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.routes').then(p => p.routes),
        data: { breadcrumb: 'Profile' }
      },
      {
        path: 'team',
        loadComponent: () => import('./team/team.component').then(c => c.TeamComponent),
        data: { breadcrumb: 'Team' }
      },
    ]
  }
];
