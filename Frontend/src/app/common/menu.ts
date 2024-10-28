import { Menu } from "./models/menu.model";


export const verticalMenuItems = [
  new Menu(1, 'Dashboard', '/login', null, 'dashboard', null, false, 0),
  new Menu(2, 'Role', '/login/role', null, 'group', null, false, 0),

  new Menu(3, 'Employee', '', null, 'person', null, true, 0),
  new Menu(3, 'Directory', '/login/users', null, 'auto_stories', null, false, 3),
  new Menu(19,'Confirmation', '/login/users/confirmation', null, 'task_alt', null, false, 3),

  new Menu(4, 'Team', '/login/team', null, 'groups', null, false, 0),

  new Menu(5, 'Approval Uploads', '', null, 'upload_file', null, true, 0),
  new Menu(6, 'Add', '/login/viewApproval/addapproval', null, 'add_circle', null, false, 5),
  // new Menu(6, 'Expense', '/login/viewApproval/expenses', null, 'payments', null, false, 5),
  new Menu(7, 'View', '/login/viewApproval', null, 'visibility', null, false, 5),
  new Menu(25, 'Excel', '/login/viewApproval/viewexcel', null, 'backup_table', null, false, 5),

  new Menu(26, 'Expense', '/login/viewApproval/expenses', null, 'payments', null, false, 0),

  new Menu(8, 'Leave', '', null, 'date_range', null, true, 0),

  new Menu(9, 'Calendar', '/login/admin-leave', null,'event_available', null, false, 8),
  new Menu(21, 'View', '/login/admin-leave/view-leave-request', null,'edit_calendar', null, false, 8),
  new Menu(10, 'Emergency', '/login/admin-leave/apply-emergency-leave', null, 'event_note', null, false, 8),
  


  new Menu(11, 'Apply Leave', '/login/employee-leave', null, 'visibility', null, false, 8),
  new Menu(12, 'Leave Balance', '/login/employee-leave/balance', null, 'visibility', null, false, 8),


  new Menu(13, 'Payroll', '', null, 'upload_file', null, true, 0),
  new Menu(25, 'Advance Salary', '/login/advance-salary', null, 'add_circle', null, false, 13),
  new Menu(14, 'Process Payroll', '/login/process-monthly-payroll', null, 'add_circle', null, false, 13),
  new Menu(15, 'Salary Statement', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(16, 'Payslip', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(17, 'YTD Reports', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(17, 'Pay Details', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(18, 'User leave', '/login/userLeave', null, 'visibility', null, false, 8),
  new Menu(20, 'Events Calender', '/login/employee-leave/events', null, 'visibility', null, false, 8),
  // new Menu(21, 'Reports', '/login/leave/reports', null, 'visibility', null, false, 8),
  new Menu(21, 'Reports', '', null, 'assessment', null, true, 0),
  new Menu(22, 'Approval Report', '/login/viewApproval/approvalReport', null, 'visibility', null, false, 21),
  new Menu(23, 'Employee Report', '/login/employee-leave/balance', null, 'visibility', null, false, 21),
  new Menu(24, 'Leave Report', '/login/employee-leave/balance', null, 'visibility', null, false, 21),

];


// export const horizontalMenuItems = [
//     new Menu (1, 'Dashboard', '/', null, 'dashboard', null, false, 0),
//     new Menu (2, 'Role',  null, null, 'group', null, true, 0),
//     new Menu (3, 'Employee', null, null, 'person', null, true, 0),
//     new Menu (4, 'Team','/login/team',   null, 'groups', null, true, 0),
//     new Menu (5, 'Approval  Uploads',  null, null, 'upload_file', null, true, 0),
//     new Menu (6, 'Add', '/login/addApproval', null, 'add_circle', null, false, 5),
//     new Menu (7, 'View', '/login/viewApproval', null, 'visibility', null, false, 5),
//     new Menu (8, 'Leave',  null, null, 'upload_file', null, true, 0),
//     new Menu (9, 'Add', '/login/addApproval', null, 'add_circle', null, false, 8),
//     new Menu (10, 'View', '/login/viewApproval', null, 'visibility', null, false, 8),
//     new Menu (11, 'Payroll',  null, null, 'upload_file', null, true, 0),
//     new Menu (12, 'Add', '/login/addApproval', null, 'add_circle', null, false, 11),
//     new Menu (13, 'View', '/login/viewApproval', null, 'visibility', null, false, 11),


// ]
