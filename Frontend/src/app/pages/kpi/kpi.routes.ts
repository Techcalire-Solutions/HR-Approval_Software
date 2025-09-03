import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
  { path: '', data: { breadcrumb: 'Holiday' },
    children: [
      {path: '', loadComponent: () => import('./kpi.component').then(c => c.KpiComponent),
        canActivate: [AuthGuard]
      }
    ]
  },
]