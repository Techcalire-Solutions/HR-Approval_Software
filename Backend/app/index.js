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
const auth = require('../users/routers/auth');
const team = require('../users/routers/team');
const teamMember = require('../users/routers/teamMember');
app.use('/role', role);
app.use('/user', user);
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

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`server started on port ${port}`);
})