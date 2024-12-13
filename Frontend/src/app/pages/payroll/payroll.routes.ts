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
  },
  { 
    path: 'month-end', 
    data: { breadcrumb: 'MonthEnd' },
    children: [
      {
        path: '', 
        loadComponent: () => import('./monthend/monthend.component').then(c => c.MonthendComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'payslip',  
        data: { breadcrumb: 'PaySlip' }, 
        children: [
          {
            path: '', 
            loadComponent: () => import('./monthend/month-wise-log/month-wise-log.component').then(c => c.MonthWiseLogComponent),
            canActivate: [AuthGuard]
          },
          {
            path: 'open/:id',  
            loadComponent: () => import('./monthend/payslip/payslip.component').then(c => c.PayslipComponent),
            data: { breadcrumb: 'Open' }, 
            canActivate: [AuthGuard]
          }
        ]
      }
    ]
  },
  { path: 'ytd', data: { breadcrumb: 'Year To Date' },
    children: [
      {path: '', loadComponent: () => import('./year-to-date/year-to-date.component').then(c => c.YearToDateComponent),
        canActivate: [AuthGuard]
      },
      // { path: 'add',  loadComponent: () => import('./advance-salary/add-advance-salary/add-advance-salary.component').then(c => c.AddAdvanceSalaryComponent),
      //   data: { breadcrumb: 'ADD' } , canActivate: [AuthGuard]
      // }
    ]
  },
  { path: 'process-payslip', data: { breadcrumb: 'Process Payslip' },
  children: [
    {path: '', loadComponent: () => import('./process-monthly-payroll/process-monthly-payroll.component').then(c => c.ProcessMonthlyPayrollComponent),
      canActivate: [AuthGuard]
    },
    // { path: 'add',  loadComponent: () => import('./advance-salary/add-advance-salary/add-advance-salary.component').then(c => c.AddAdvanceSalaryComponent),
    //   data: { breadcrumb: 'ADD' } , canActivate: [AuthGuard]
    // }
  ]
},

];
