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
      },
      { path: 'compo-off/:id',  loadComponent: () => import('./add-combooff/add-combooff.component').then(c => c.AddCombooffComponent),
        data: { breadcrumb: 'Compo-Off' } , canActivate: [AuthGuard]
      },
      { path: 'employee-compoff',  loadComponent: () => import('./employee-compoff/employee-compoff.component').then(c => c.EmployeeCompoffComponent),
        data: { breadcrumb: 'Employee Comp-Off Details' } , canActivate: [AuthGuard]
      }
    ]
  },
]