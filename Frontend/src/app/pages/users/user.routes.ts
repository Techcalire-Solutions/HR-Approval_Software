import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
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
  }
];
