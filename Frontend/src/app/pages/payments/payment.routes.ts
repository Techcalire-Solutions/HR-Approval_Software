import { Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: PaymentsComponent,
        
    //   children: [
    //     {path: '', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
    //       data: { breadcrumb: 'Dashboard' }, canActivate: [AuthGuard]
    //     },
    //   ]
    },
    {
        path: 'expenses',
        canActivate: [AuthGuard], data: { breadcrumb: 'Expense' }, children: [
          {
            path: '',
            loadComponent: () => import('./expense/expense.component').then(c => c.ExpenseComponent),
          },          
          // {
          //   path: 'view',
          //   loadComponent: () => import('./add-approval/expense/view-expense/view-expense.component').then(c => c.ViewExpenseComponent),
          //   data: { breadcrumb: 'View' }
          // },
        ]
      },
]