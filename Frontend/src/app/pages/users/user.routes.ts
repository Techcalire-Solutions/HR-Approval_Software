import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: UsersComponent, data: { breadcrumb: 'Users' }, canActivate: [AuthGuard]},
  { path: ':id',  loadComponent: () => import('./user-dialog/user-dialog.component').then(c => c.UserDialogComponent),
    data: { breadcrumb: 'Add' } , canActivate: [AuthGuard]
  },
  { path: 'edit/:id',  loadComponent: () => import('./user-dialog/user-dialog.component').then(c => c.UserDialogComponent),
     data: { breadcrumb: 'Edit' }, canActivate: [AuthGuard]
  }
];
