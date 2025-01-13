import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';


export const routes: Routes = [
  { path: '', data: { breadcrumb: 'Holiday' },
    children: [
      {path: '', loadComponent: () => import('./holiday.component').then(c => c.HolidayComponent),
        canActivate: [AuthGuard]
      },
      { path: 'add',  loadComponent: () => import('./add-holiday/add-holiday.component').then(c => c.AddHolidayComponent),
        data: { breadcrumb: 'ADD' } , canActivate: [AuthGuard]
      }
    ]
  },
]