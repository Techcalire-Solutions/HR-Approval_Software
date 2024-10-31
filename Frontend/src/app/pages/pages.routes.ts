import { Routes } from '@angular/router';
import { PagesComponent } from './pages.component';
import { AuthGuard } from '../common/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: PagesComponent,
    children: [
      {path: '', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }, canActivate: [AuthGuard]
      },
      {path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent),
        data: { breadcrumb: 'Dashboard' }, canActivate: [AuthGuard]
      },
      {path: 'announcements', loadComponent: () => import('./announcements/announcements.component').then(c => c.AnnouncementsComponent),
        data: { breadcrumb: 'Announcements' }, canActivate: [AuthGuard]
      },
      {
        path: 'tree',
        loadComponent: () => import('./hierarchy-tree/hierarchy-tree.component').then(c => c.HierarchyTreeComponent),
        data: { breadcrumb: 'HierarchyTree' }, canActivate: [AuthGuard]
      },

      {
        path: 'role',
        loadComponent: () => import('./role/role.component').then(c => c.RoleComponent),
        data: { breadcrumb: 'Designation' }, canActivate: [AuthGuard]
      },
      {
        path: 'users',
        loadChildren: () => import('./users/user.routes').then(c => c.routes),
        data: { breadcrumb: 'Employees' }, canActivate: [AuthGuard]
      },
      // {path: 'leaveType', loadComponent: () => import('./admin-leave/leave-types/leave-types.component').then(c => c.LeaveTypesComponent),
      //   data: { breadcrumb: 'Leave Type' }, canActivate: [AuthGuard]
      // },
      {
        path: 'admin-leave',
        loadChildren: () => import('./admin-leave/admin-leave.routes').then(c => c.routes),
        data: { breadcrumb: 'Leave' }, canActivate: [AuthGuard]
      },
      {
        path: 'employee-leave',
        loadChildren: () => import('./employee-leave/employee-leave.routes').then(c => c.routes),
        data: { breadcrumb: 'VIEW LEAVES' }, canActivate: [AuthGuard]
      },
      {
        path: 'payroll',
        loadChildren: () => import('./payroll/payroll.routes').then(c => c.routes),
        data: { breadcrumb: 'Payroll' }, canActivate: [AuthGuard]
      },
      // {
      //   path: 'addApproval',
      //   loadComponent: () => import('./add-approval/add-approval.component').then(c => c.AddApprovalComponent),
      //   data: { breadcrumb: 'Add Approval' }, canActivate: [AuthGuard]
      // },
      // {
      //   path: 'expenses',
      //   loadComponent: () => import('./add-approval/expense/expense.component').then(c => c.ExpenseComponent),
      //   canActivate: [AuthGuard], data: { breadcrumb: 'Expense' },
      // },
      // {
      //   path: 'viewexcel',
      //   loadComponent: () => import('./add-approval/view-excel/view-excel.component').then(c => c.ViewExcelComponent),
      //   canActivate: [AuthGuard], data: { breadcrumb: 'View Excel' },
      // },
      {
        path: 'viewApproval',
        loadChildren: () => import('./payments/payment.routes').then(c => c.routes),canActivate: [AuthGuard]
      },
      // {
      //   path: 'approvalReport',
      //   loadComponent: () => import('./add-approval/approval-report/approval-report.component').then(c => c.ApprovalReportComponent),
      //   data: { breadcrumb: 'Approval Report' }, canActivate: [AuthGuard]
      // },


      // {
      //   path: 'updatePI/:id',
      //   loadComponent: () => import('./add-approval/update-pi/update-pi.component').then(c => c.UpdatePIComponent),
      //   data: { breadcrumb: 'Update PI' }, canActivate: [AuthGuard]
      // },


      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.routes').then(p => p.routes),
        data: { breadcrumb: 'Profile' }, canActivate: [AuthGuard]
      },
      {
        path: 'team',
        loadComponent: () => import('./team/team.component').then(c => c.TeamComponent),
        data: { breadcrumb: 'Team' }, canActivate: [AuthGuard]
      },
      {
        path: 'advanceSalary',
        loadComponent: () => import('./payroll/advance-salary/advance-salary.component').then(c => c.AdvanceSalaryComponent),
        data: { breadcrumb: 'Advance salary' }, canActivate: [AuthGuard]
      },
      {
        path: 'process-monthly-payroll',
        loadComponent: () => import('./payroll/process-monthly-payroll/process-monthly-payroll.component').then(c => c.ProcessMonthlyPayrollComponent),
        data: { breadcrumb: 'PROCESS PAYROLL' }, canActivate: [AuthGuard]
      },
      {
        path: 'company',

        data: { breadcrumb: 'Company' },
        // canActivate: [AuthGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./company/company.component').then(c => c.CompanyComponent),
            canActivate: [AuthGuard]
          },
          {
            path: 'addCompany',
            loadComponent: () => import('./company/add-company/add-company.component').then(c => c.AddCompanyComponent),
            data: { breadcrumb: 'Manage Company' },
            canActivate: [AuthGuard]
          },
          {
            path: 'viewCompany/:id',
            loadComponent: () => import('./company/company-detailed/company-detailed.component').then(c => c.CompanyDetailedComponent),
            data: { breadcrumb: 'View Company' },
            canActivate: [AuthGuard]
          }
        ]
      }


    ]
  }
];

