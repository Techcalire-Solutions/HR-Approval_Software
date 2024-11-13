import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';


export const routes: Routes = [
  { path: 'advance-salary', data: { breadcrumb: 'Advance Salary' },
    children: [
      {path: '', loadComponent: () => import('./advance-salary/advance-salary.component').then(c => c.AdvanceSalaryComponent),
        canActivate: [AuthGuard]
      },
      { path: 'add',  loadComponent: () => import('./advance-salary/add-advance-salary/add-advance-salary.component').then(c => c.AddAdvanceSalaryComponent),
        data: { breadcrumb: 'ADD' } , canActivate: [AuthGuard]
      },
      { path: 'viewlogs',  loadComponent: () => import('./advance-salary/view-log/view-log.component').then(c => c.ViewLogComponent),
        data: { breadcrumb: 'LOGS' } , canActivate: [AuthGuard]
      },
    ]
  }

];
