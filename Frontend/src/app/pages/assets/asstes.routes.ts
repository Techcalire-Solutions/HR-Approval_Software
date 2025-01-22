import { Routes } from '@angular/router';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
      { path: '',
        children: [
          {
            path: '', loadComponent: () => import('./assets.component').then(c => c.AssetsComponent),
            canActivate: [AuthGuard]
          },
        ]
      }
]