import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';
import { UserDialogComponent } from './user-dialog/user-dialog.component';

export const routes: Routes = [
  { path: '', component: UsersComponent, data: { breadcrumb: 'Users' }},
  { path: ':id',  loadComponent: () => import('./user-dialog/user-dialog.component').then(c => c.UserDialogComponent), data: { breadcrumb: 'Add' } },
  { path: 'new', component: UserDialogComponent, data: { breadcrumb: 'Edit' } }
];
