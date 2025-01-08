import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: UsersComponent, data: { breadcrumb: 'Users' }, canActivate: [AuthGuard]},
  { path: 'new',  loadComponent: () => import('./user-dialog/user-dialog.component').then(c => c.UserDialogComponent),
    data: { breadcrumb: 'Add' } , canActivate: [AuthGuard]
  },
  { path: 'edit/:id',  loadComponent: () => import('./user-dialog/user-dialog.component').then(c => c.UserDialogComponent),
    data: { breadcrumb: 'Edit' }, canActivate: [AuthGuard]
  },
  { path: 'view/:id',  loadComponent: () => import('./view-user/view-user.component').then(c => c.ViewUserComponent),
    data: { breadcrumb: 'Open' }, canActivate: [AuthGuard]
  },
  { path: 'confirmation',  loadComponent: () => import('./confirmation/confirmation.component').then(c => c.ConfirmationComponent),
    data: { breadcrumb: 'Confirmation' }, canActivate: [AuthGuard]
  },
  { path: 'payroll/:id',  loadComponent: () => import('../payroll/add-payroll/add-payroll.component').then(c => c.AddPayrollComponent),
    data: { breadcrumb: 'Salary' }, canActivate: [AuthGuard]
  },
  { path: 'assets/:id',  loadComponent: () => import('../users/user-assets/user-assets.component').then(c => c.UserAssetsComponent),
    data: { breadcrumb: 'Assests' }, canActivate: [AuthGuard]
  },
  { path: 'separated',  loadComponent: () => import('../users/view-separated/view-separated.component').then(c => c.ViewSeparatedComponent),
    data: { breadcrumb: 'Separated' }, canActivate: [AuthGuard]
  }
];
