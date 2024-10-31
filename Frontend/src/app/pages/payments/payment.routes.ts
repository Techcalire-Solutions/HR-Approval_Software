import { Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
    { path: '', children:[
      {
        path: 'view',
        data: { breadcrumb: 'Invoices' },
        loadComponent: () => import('./payments.component').then(c => c.PaymentsComponent), 
        canActivate: [AuthGuard]
      },
      { path: 'updatePI/:id', loadComponent: () => import('./update-pi/update-pi.component').then(c => c.UpdatePIComponent),
        data: { breadcrumb: 'Update' }, canActivate: [AuthGuard]
      },
      {
        path: 'approvalReport',
        data: { breadcrumb: 'Report' },
        children: [
          {
            path: '',
            loadComponent: () => import('./approval-report/approval-report.component')
              .then(c => c.ApprovalReportComponent),
            canActivate: [AuthGuard] 
          },
          {
            path: 'excellog', data: { breadcrumb: 'Excel' }, children: [
              {
                path: '',
                loadComponent: () => import('./approval-report/excel-log/excel-log.component')
                  .then(c => c.ExcelLogComponent),
                canActivate: [AuthGuard] 
              },
              {
                path: 'openexcel',
                loadComponent: () => import('./approval-report/view-excel-report/view-excel-report.component')
                  .then(c => c.ViewExcelReportComponent),
                canActivate: [AuthGuard], data: { breadcrumb: 'Report' },
              }
            ]
          }
        ]
      },
      {
        path: 'addapproval',
        loadComponent: () => import('./add-approval/add-approval.component').then(c => c.AddApprovalComponent),
        data: { breadcrumb: 'Add' }, canActivate: [AuthGuard]
      },
  
      {
        path: 'viewexcel',
        loadComponent: () => import('./view-approval/view-excel/view-excel.component').then(c => c.ViewExcelComponent),
        canActivate: [AuthGuard], data: { breadcrumb: 'View Excel' },
      },
  
      {
        path: 'viewinvoices/:id',
        loadComponent: () => import('./view-approval/view-invoices/view-invoices.component').then(c => c.ViewInvoicesComponent),
        data: { breadcrumb: 'Open Invoices' }, canActivate: [AuthGuard]
      },
    ]},

    {
      path: 'expenses', canActivate: [AuthGuard], data: { breadcrumb: 'Expense' },
      loadComponent: () => import('./expense/expense.component').then(c => c.ExpenseComponent),
    },
    {
      path: 'expenses/:id', canActivate: [AuthGuard], data: { breadcrumb: 'Edit Expense' },
      loadComponent: () => import('./expense/expense.component').then(c => c.ExpenseComponent),
    },
    {
      path: '',
      data: { breadcrumb: 'View Expenses' }, canActivate: [AuthGuard], children: [
        {
          path: 'viewexpenses',
          loadComponent: () => import('./expense/view-expense/view-expense.component').then(c => c.ViewExpenseComponent)
        },
        {
          path: 'openexpenses/:id',
          loadComponent: () => import('./expense/open-expense/open-expense.component').then(c => c.OpenExpenseComponent),
          data: { breadcrumb: 'Open' }, canActivate: [AuthGuard]
        },
      ]
    },

]