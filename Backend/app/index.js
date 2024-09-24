const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors')
const sequelize = require('../utils/db');
const path = require('path');

dotenv.config();
app.use(cors({ origin: '*' }));
app.use(express.json());

const syncModel = require('../utils/association')
syncModel()

const role = require('../users/routers/role');

const user = require('../users/routers/user');
const userPersonal = require('../users/routers/userPersonal');
const statutoryInfo = require('../users/routers/statutoryInfo');
const userAccount = require('../users/routers/userAccount');
const userPosition = require('../users/routers/userPosition');
const userDocument = require('../users/routers/userDocument');

const auth = require('../users/routers/auth');
const team = require('../users/routers/team');
const teamMember = require('../users/routers/teamMember');
app.use('/role', role);

app.use('/user', user);
app.use('/personal', userPersonal)
app.use('/statutoryinfo', statutoryInfo)
app.use('/account', userAccount)
app.use('/position', userPosition)
app.use('/document', userDocument)

app.use('/auth', auth);
app.use('/team', team);
app.use('/teamMember', teamMember);

const invoice = require('../invoices/routers/invoice');
const pi = require('../invoices/routers/performaInvoice');
const piStatus = require('../invoices/routers/invoiceStatus');
app.use('/invoice', invoice);
app.use('/performaInvoice', pi);
app.use('/invoiceStatus', piStatus);

app.use('/invoices/uploads', express.static(path.join(__dirname, '../invoices/uploads')));
app.use('/users/userImages', express.static(path.join(__dirname, '../users/userImages')));


const leave = require('../leave/routers/leave');
const leaveType = require('../leave/routers/leaveType');
const userLeave = require('../leave/routers/userLeave');

app.use('/leave', leave);
app.use('/leaveType', leaveType);
app.use('/userLeave', userLeave);


console.log(process.env.DB_NAME, process.env.USER_NAME, process.env.DB_PASSWORD, process.env.DB_HOST, "________________________________________________")
const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`server started on port ${port}`);
})