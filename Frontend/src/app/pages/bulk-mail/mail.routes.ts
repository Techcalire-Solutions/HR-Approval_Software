import { Routes } from '@angular/router';

import { AuthGuard } from '../../common/guards/auth.guard';
import { BulkMailComponent } from './bulk-mail.component';
import { BirthdayMessageDraftComponent } from './birthday-message-draft/birthday-message-draft.component';
import { EventMailerComponent } from './event-mailer/event-mailer.component';

export const routes: Routes = [
  { path: '', component: BulkMailComponent, data: { breadcrumb: 'Mail' }, canActivate: [AuthGuard]},
  { path: 'birthday-draft/:name', component: BirthdayMessageDraftComponent },
  {path : 'event', component:EventMailerComponent}
  // { path: 'new',  loadComponent: () => import('./user-dialog/user-dialog.component').then(c => c.UserDialogComponent),
  //   data: { breadcrumb: 'Add' } , canActivate: [AuthGuard]
  // },
 
];
