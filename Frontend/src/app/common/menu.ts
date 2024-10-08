import { Menu } from "./models/menu.model";


export const verticalMenuItems = [
  new Menu(1, 'Dashboard', '/login', null, 'dashboard', null, false, 0),
  new Menu(2, 'Role', '/login/role', null, 'group', null, false, 0),

  new Menu(3, 'Employee', '', null, 'person', null, true, 0),
  new Menu(3, 'Directory', '/login/users', null, 'auto_stories', null, false, 3),
  new Menu(19,'Confirmation', '/login/users/confirmation', null, 'task_alt', null, false, 3),

  new Menu(4, 'Team', '/login/team', null, 'groups', null, false, 0),

  new Menu(5, 'Approval Uploads', '', null, 'upload_file', null, true, 0),
  new Menu(6, 'Add', '/login/addApproval', null, 'add_circle', null, false, 5),
  new Menu(7, 'View', '/login/viewApproval', null, 'visibility', null, false, 5),

  new Menu(8, 'Leave', '', null, 'upload_file', null, true, 0),
  new Menu(9, 'View Request', '/login/leave/view-leave-request', null,'visibility', null, false, 8),
  new Menu(9, 'Calendar View', '/login/leave/calendarView', null,'visibility', null, false, 8),

  new Menu(10, 'Emergency Leave', '/login/leave/leaverequest', null, 'add_circle', null, false, 8),
  new Menu(11, 'Apply Leave', '/login/leave', null, 'visibility', null, false, 8),
  new Menu(12, 'Leave Balance', '/login/leave/leaverequest', null, 'visibility', null, false, 8),


  new Menu(13, 'Payroll', '', null, 'upload_file', null, true, 0),
  new Menu(14, 'Process Payroll', '/login/addApproval', null, 'add_circle', null, false, 13),
  new Menu(15, 'Salary Statement', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(16, 'Payslip', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(17, 'YTD Reports', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(17, 'Pay Details', '/login/viewApproval', null, 'visibility', null, false, 13),
  new Menu(18, 'User leave', '/login/userLeave', null, 'visibility', null, false, 8),
  new Menu(19, 'Events Calender', '/login/leave/events', null, 'visibility', null, false, 8),

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
