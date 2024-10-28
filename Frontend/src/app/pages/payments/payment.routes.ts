import { Routes } from '@angular/router';
import { PaymentsComponent } from './payments.component';
import { AuthGuard } from '../../common/guards/auth.guard';

export const routes: Routes = [
    { path: '', component: PaymentsComponent},
    {
      path: 'expenses', canActivate: [AuthGuard], data: { breadcrumb: 'Expense' },
      loadComponent: () => import('./expense/expense.component').then(c => c.ExpenseComponent),
    },
    {
      path: 'expenses/:id', canActivate: [AuthGuard], data: { breadcrumb: 'Edit Expense' },
      loadComponent: () => import('./expense/expense.component').then(c => c.ExpenseComponent),
    },
    {
      path: 'updatePI/:id',
      loadComponent: () => import('./update-pi/update-pi.component').then(c => c.UpdatePIComponent),
      data: { breadcrumb: 'Update PI' }, canActivate: [AuthGuard]
    },
    {
      path: 'approvalReport',
      loadComponent: () => import('./approval-report/approval-report.component').then(c => c.ApprovalReportComponent),
      data: { breadcrumb: 'Approval Report' }, canActivate: [AuthGuard]
    },
    {
      path: 'addapproval',
      loadComponent: () => import('./add-approval/add-approval.component').then(c => c.AddApprovalComponent),
      data: { breadcrumb: 'Add Approval' }, canActivate: [AuthGuard]
    },

    {
      path: 'viewexcel',
      loadComponent: () => import('./view-approval/view-excel/view-excel.component').then(c => c.ViewExcelComponent),
      canActivate: [AuthGuard], data: { breadcrumb: 'View Excel' },
    },

    {
      path: 'viewinvoices/:id',
      loadComponent: () => import('./view-approval/view-invoices/view-invoices.component').then(c => c.ViewInvoicesComponent),
      data: { breadcrumb: 'View Invoices' }, canActivate: [AuthGuard]
    },
]