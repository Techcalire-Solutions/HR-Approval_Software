/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors')
const cron = require('node-cron');

dotenv.config();
app.use(cors({ origin: '*' }));
app.use(express.json());

const syncModel = require('../utils/association')
syncModel()

const role = require('../users/routers/role');
const designation = require('../users/routers/designation');

const user = require('../users/routers/user');
const userPersonal = require('../users/routers/userPersonal');
const statutoryInfo = require('../users/routers/statutoryInfo');
const userAccount = require('../users/routers/userAccount');
const userPosition = require('../users/routers/userPosition');
const userDocument = require('../users/routers/userDocument');
const userAssets = require('../users/routers/userAssets');
const userQual = require('../users/routers/userQualification');
const Nominee = require('../users/routers/userNominee');
const auth = require('../users/routers/auth');
const team = require('../users/routers/team');
const teamMember = require('../users/routers/teamMember');
app.use('/role', role);
app.use('/designation', designation);

app.use('/user', user);
app.use('/personal', userPersonal)
app.use('/statutoryinfo', statutoryInfo)
app.use('/account', userAccount)
app.use('/position', userPosition)
app.use('/document', userDocument)
app.use('/asset', userAssets)
app.use('/qualification', userQual)
app.use('/nominee', Nominee)
app.use('/auth', auth);
app.use('/team', team);
app.use('/teamMember', teamMember);

const invoice = require('../invoices/routers/invoice');
const pi = require('../invoices/routers/performaInvoice');
const piStatus = require('../invoices/routers/invoiceStatus');
const excelLog = require('../invoices/routers/excelLog');
app.use('/invoice', invoice);
app.use('/performaInvoice', pi);
app.use('/invoiceStatus', piStatus);
app.use('/excelLog', excelLog);

const company = require('../invoices/routers/company');
app.use('/company', company);

// app.use('/invoices/uploads', express.static(path.join(__dirname, '../invoices/uploads')));
// app.use('/users/userImages', express.static(path.join(__dirname, '../users/userImages')));

const leave = require('../leave/routers/leave');
const leaveType = require('../leave/routers/leaveType');
const userLeave = require('../leave/routers/userLeave');
app.use('/leave', leave);
app.use('/leaveType', leaveType);
app.use('/userLeave', userLeave);

const announcements = require('../announcements/router/announcement');
app.use('/announcements', announcements)

const expense = require('../expense/routers/expense');
app.use('/expense', expense);

const advanceSalary = require('../payroll/routers/advanceSalary');
const payroll = require('../payroll/routers/payroll');
const payrollLog = require('../payroll/routers/payrollLog');
const monthlyPayroll = require('../payroll/routers/monthlyPayroll');
app.use('/payroll', payroll);
app.use('/payrolllog', payrollLog);
app.use('/monthlypayroll', monthlyPayroll);
app.use('/advanceSalary', advanceSalary);

const holiday = require('../leave/routers/holiday');
app.use('/holidays', holiday);

const notification = require('../invoices/routers/notification')
app.use('/notification',notification)

const chat = require('../chat/router/chat');
app.use('/chat', chat);


const backup = require('./backUp')
cron.schedule('0 0 5 * *', () => {
    backup();
});


// cron.schedule('* * * * *', () => {
//     backup();
// });
// 0 - The task will start at minute 0.
// 0 - The task will start at hour 0 (midnight).
// 1 - The task will run on the 1st day of the month.
// * - The task will run in all months.
// * - The task will run on any day of the week.

const backUpLogRouter = require('./backupLogRouter');
app.use('/backup', backUpLogRouter);

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`server started on port ${port}`);
})