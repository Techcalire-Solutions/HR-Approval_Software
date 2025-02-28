/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const router = express.Router();
const MonthlyPayroll = require("../models/monthlyPayroll");
const User = require('../../users/models/user');
const AdvanceSalary = require("../models/advanceSalary");
const sequelize = require('../../utils/db');
const UserPersonal = require("../../users/models/userPersonal");
const UserAccount = require("../../users/models/userAccount");
const StatutoryInfo = require("../../users/models/statutoryInfo");
const UserPosition = require("../../users/models/userPosition");
const Designation = require("../../users/models/designation");
const { Op } = require('sequelize');
const authenticateToken = require('../../middleware/authorization');
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });
const puppeteer = require("puppeteer");
const Payroll = require("../models/payroll");
const Role = require("../../users/models/role");
const { sendEmail } = require('../../app/emailService');
const config = require('../../utils/config')
const { createNotification } = require('../../app/notificationService');
const Leave = require("../../leave/models/leave");


router.post("/save", authenticateToken, async (req, res) => {
  const data = req.body.payrolls;
  try {
    const results = []; 
    for (const element of data) {
      const {
        userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, esi, tds,
        advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, leaveDays, daysInMonth, leaveEncashment, leaveEncashmentAmount,
      } = element;

      // Save the payroll
      const monthlyPayroll = await MonthlyPayroll.create({
        userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, esi, tds,
        advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt: new Date(), leaveDays, daysInMonth, leaveEncashment, leaveEncashmentAmount,
      });

      results.push(monthlyPayroll);
    }

    res.status(200).send({ message: "Payrolls saved successfully", payrolls: results });
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/find", authenticateToken, async (req, res) => {
  let whereClause = { status: 'Locked' };
  let limit;
  let offset;
  if (req.query.search !== 'undefined') {
    const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
    whereClause = {
      [Op.and]: [
        {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('payedFor'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('user.name'), ' ', '')),
              { [Op.like]: `%${searchTerm}%` }
            ),
          ]
        },
        { status: 'Locked' },
      ]
    };
  }

  if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
    limit = req.query.pageSize;
    offset = (req.query.page - 1) * req.query.pageSize;
  }

  try {
    const monthlyPayroll = await MonthlyPayroll.findAll({ 
      where: whereClause, limit: limit, offset: offset,
      include:[
          { model: User, attributes: ['name','empNo'], as: 'user', required: false}
      ], order: [['id', 'DESC']]
    });
    
    totalCount = await MonthlyPayroll.count({});

    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: monthlyPayroll,
      };

      res.json(response);
    } else {
      res.json(monthlyPayroll);
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/findbyuser/:id", authenticateToken, async (req, res) => {
  let whereClause = { status: 'Locked', userId: req.params.id };
  let limit;
  let offset;
  if (req.query.search !== 'undefined') {
    const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
    whereClause = {
      [Op.and]: [
        {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('payedFor'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        },
        { status: 'Locked', userId: req.params.id },
      ]
    };
  }

  if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
    limit = req.query.pageSize;
    offset = (req.query.page - 1) * req.query.pageSize;
  }

  try {
    const monthlyPayroll = await MonthlyPayroll.findAll({ 
      where: whereClause, limit: limit, offset: offset,
      include:[
          { model: User, attributes: ['name','empNo']}
      ], order: [['id', 'DESC']]
    });
    totalCount = await MonthlyPayroll.count({where: whereClause});

    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: monthlyPayroll,
      };

      res.json(response);
    } else {
      res.json(monthlyPayroll);
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.get("/bypayedfor", authenticateToken, async (req, res) => {
  try {
    const { payedFor } = req.query;
    
    const monthlyPayroll = await MonthlyPayroll.findAll({ 
      where: { payedFor: payedFor }, include: [
        {model: User, attributes: ['name','empNo']}
      ]
    });

    return res.status(200).json(monthlyPayroll);
  
  } catch (error) {
    res.send(error.message)
  }
});

router.post("/update", authenticateToken, async (req, res) => {
  const data = req.body.payrolls;

  // Validate input data
  if (!Array.isArray(data) || data.length === 0) {
    return res.send("Invalid payroll data provided." );
  }

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    for (const payroll of data) {
      const {
        userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, esi, tds,
        advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt, leaveDays, status = 'Added', leaveEncashment, leaveEncashmentAmount
      } = payroll;

      if (!userId || !payedFor) {
        throw new Error("Missing required fields: userId and payedFor are mandatory.");
      }

      const existingPayroll = await MonthlyPayroll.findOne({
        where: { userId, payedFor },
        transaction,
      });

      if (existingPayroll) {
        await existingPayroll.update(
          {
            basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, esi, tds,
            advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedAt, leaveDays, status, leaveEncashment, leaveEncashmentAmount
          },
          { transaction }
        );
      } else {
        // Create new payroll record
        await MonthlyPayroll.create(
          {
            userId, basic, hra, conveyanceAllowance, lta, specialAllowance, ot, incentive, payOut, pfDeduction, esi, tds,
            advanceAmount, leaveDeduction, incentiveDeduction, toPay, payedFor, payedAt, leaveDays, status, leaveEncashment, leaveEncashmentAmount
          },
          { transaction }
        );
      }
    }

    // Commit transaction
    await transaction.commit();
    return res.status(200).json({ message: "Payrolls updated successfully." });
  } catch (error) {
    // Rollback transaction in case of error
    if (transaction) await transaction.rollback();
    return res.send(error.message);
  }
});

router.get('/findbyid/:id', authenticateToken, async (req, res) => {
  try {
    const monthlyPayroll = await MonthlyPayroll.findByPk(req.params.id,{ 
      include: [
        {model: User, attributes: ['name','empNo'], include: [
          {model: UserPersonal, attributes: ['dateOfJoining']},
          {model: UserAccount},
          {model: StatutoryInfo, attributes: ['panNumber', 'uanNumber', 'pfNumber']},
          {model: UserPosition, attributes: ['designationId', 'department', 'location'], include:[
            {model: Designation, attributes: ['designationName']}
          ]}
        ]}
      ]
    });

    return res.status(200).json(monthlyPayroll);
  
  } catch (error) {
    res.send(error.message)
  }
})

router.patch('/statusupdate/', authenticateToken, async (req, res) => {
  const { payrollData, status } = req.body;
  const payedForStr = payrollData[0].payedFor;
  const payedForDate = new Date(payedForStr);
  const payrollYear = payedForDate.getFullYear();
  const payrollMonth = payedForDate.getMonth();
  console.log(payedForStr, payedForDate, payrollYear, payrollMonth);
  
  if (payedForStr.startsWith("December")){
    await Leave.update(
      { status: 'Locked' },
      {
        where: {
          startDate: {
            [Op.gte]: new Date(payrollYear, 0, 1),
            [Op.lt]: new Date(payrollYear + 1, 0, 1)
          },
        },
      }
    )
  }

  for (const element of payrollData) {
    const { userId } = element;
    const advanceSalary = await AdvanceSalary.findOne({ where: { userId, status: true } });
    if (advanceSalary) {
      advanceSalary.completed += 1;
      if (advanceSalary.duration === advanceSalary.completed) {
        advanceSalary.status = false;
        advanceSalary.completedDate = new Date();
        advanceSalary.closeNote = 'Advance Payment is completed successfully';
      }
      await advanceSalary.save();
    }
  }


  function toNumber(value) {
    return Number(value) || 0;
  }

  function calculateTotalEarnings(payroll) {
    return (
      toNumber(payroll.basic) +
      toNumber(payroll.hra) +
      toNumber(payroll.specialAllowance) +
      toNumber(payroll.conveyanceAllowance) +
      toNumber(payroll.lta) +
      toNumber(payroll.ot) +
      toNumber(payroll.incentiveDeduction) +
      toNumber(payroll.payOut) + 
      toNumber(payroll.leaveEncashmentAmount)
    );
  }

  function calculateTotalDeductions(payroll) {
    return (
      toNumber(payroll.pfDeduction) +
      toNumber(payroll.tds) +
      toNumber(payroll.advanceAmount) +
      toNumber(payroll.leaveDeduction) +
      toNumber(payroll.esi) +
      toNumber(payroll.incentiveDeduction)
    );
  }

  function convertNumberToWords(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return "Invalid amount";
    }

    amount = Number(amount); // Ensure the amount is a number

    if (amount === 0) return "zero";

    const words = [
        "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"
    ];
    const tens = [
        "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    ];
    const scales = ["", "thousand", "million", "billion"];

    let word = "";

    function getWord(n, scale) {
        let res = "";
        if (n > 99) {
            res += words[Math.floor(n / 100)] + " hundred ";
            n %= 100;
        }
        if (n > 19) {
            res += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        }
        if (n > 0) {
            res += words[n] + " ";
        }
        return res.trim() + (scale ? " " + scale : "");
    }

    const [integerPart, fractionalPart] = amount.toFixed(2).split('.').map(Number);

    // Convert integer part
    let scaleIndex = 0;
    let integerWord = "";
    let tempIntPart = integerPart;

    while (tempIntPart > 0) {
        const chunk = tempIntPart % 1000;
        if (chunk > 0) {
            integerWord = getWord(chunk, scales[scaleIndex]) + " " + integerWord;
        }
        tempIntPart = Math.floor(tempIntPart / 1000);
        scaleIndex++;
    }

    // Convert fractional part
    let fractionalWord = "";
    if (fractionalPart > 0) {
        fractionalWord = getWord(fractionalPart, "") + " paise";
    }

    // Combine integer and fractional parts
    word = integerWord.trim();
    if (fractionalWord) {
        word += " and " + fractionalWord;
    }

    return word.trim();
  }

  if (!Array.isArray(payrollData) || payrollData.length === 0) {
    return res.send("Invalid or missing payrollData." );
  }

  if (!status) {
    return res.send("Status is required.");
  }

  try {
    // Use a transaction for atomic updates
    await sequelize.transaction(async (transaction) => {
      const updatePromises = payrollData.map(async (element) => {
        try {
          // Find the payroll entry
          const mp = await MonthlyPayroll.findByPk(element.id, {
            transaction,
            include: [
              {
                model: User, as: 'user',
                attributes: ['name', 'empNo', 'email'],
                include: [
                  { model: UserPersonal, as: 'userpersonal', attributes: ['dateOfJoining'] },
                  { model: UserAccount },
                  {
                    model: StatutoryInfo,
                    attributes: ['panNumber', 'uanNumber', 'pfNumber'],
                  },
                  {
                    model: UserPosition,
                    attributes: ['designationId', 'department', 'location'],
                    include: [
                      {
                        model: Designation,
                        attributes: ['designationName'],
                      },
                    ],
                  },
                ],
              },
            ],
          });
    
          if (!mp) {
            throw new Error(`Payroll entry with ID ${element.id} not found.`);
          }
    
          // Update the status and save the payroll entry
          mp.status = status;
          await mp.save({ transaction });
    
          const workingDays = mp.daysInMonth - mp.leaveDays;
    
          // Fetch full payroll data
          const fullValue = await Payroll.findOne({ where: { userId: mp.userId } });
          if (!fullValue) {
            throw new Error("Salary Details is not added for the employee");
          }
    
          // Fetch user and role information
          const user = await User.findByPk(req.user.id, {
            include: [
              {
                model: UserPosition,
                attributes: ['designationId'],
                include: {
                  model: Designation,
                  attributes: ['designationName'],
                },
              },
              { model: Role, attributes: ['roleName'] },
            ],
          });
    
          let designation;
          if (
            user.role.roleName !== 'Super Administrator' &&
            user.role.roleName !== 'HR Administrator'
          ) {
            if (!user.userPosition || !user.userPosition.designationId) {
              throw new Error(`Designation of the sender ${user.name} is not added`);
            }
            designation = user.userPosition.designation.designationName;
          } else {
            designation = user.role.roleName;
          }
    
          // Calculate earnings and deductions
          const totalEarnings = calculateTotalEarnings(mp);
          const totalDeductions = calculateTotalDeductions(mp);
          const payedFor = mp.payedFor
          const payedForWithoutYear = payedFor.replace(/\s*\d{4}$/, '');

          const pdfContent = `
          <html>
            <head>
              <style>
              body {
                  font-family: Arial, sans-serif;
              }
              .payslip-container {
                  width: 800px;
                  margin-left: 50px;
                  margin-right: 50px;
                  border: 1px solid #000;
                  padding: 20px;
              }
              .header, .footer {
                  text-align: center;
                  font-weight: bold;
              }
              .company-info, .employee-info, .earnings-deductions {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                  font-size: 12px;
              }
              .company-info td, .employee-info td, .earnings-deductions td {
                  padding: 8px;
                  border: 1px solid #000;
                  font-size: 12px;
              }
              .section-title {
                  font-weight: bold;
                  text-align: center;
                  padding: 10px 0;
              }
              .earnings-deductions th {
                  text-align: left;
                  padding: 8px;
              }
              .net-pay {
                  font-weight: bold;
                  text-align: center;
                  padding: 10px 0;
              }

              .header-row {
                  display: flex;
                  align-items: center; 
              }

              .logo img {
                  max-width: 180px;
                  margin-right: 30px;
                  margin-left: 10px;
              }

              .address {
                  text-align: center;
                  font-size: 14px;
              }

              .address h2{
                  text-align: center; 
                  font-weight: bolder;
              }

              .payslip-title{
                  text-align: center;
                  font-size: 14px;
              }

              .header {
                display: flex;
                justify-content: flex-end; /* Moves content to the right */
                margin-bottom: 20px; /* Adds spacing between button and content */
              }
              
              .download-button {
                background-color: #007bff; /* Customize button color */
                color: white;
                border: none;
                padding: 10px 20px;
                font-size: 14px;
                border-radius: 4px;
                cursor: pointer;
              }
                
              </style>
            </head>
            <body>
            <div class="payroll-container" style="margin-left: 30px; margin-right: 20px;"> 
                      <div class="header-row">
                          <div class="logo">
                              <img src="https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/images/OAC-+LOGO+edited.jpg" alt="Company Logo">
                          </div>
                          <div class="address">
                              <h3>ONBOARD AERO CONSULTANTS PRIVATE LIMITED</h3>
                              <p>BUILDING NO.48/768-C-2 SHREE LATHA BUILDING EROOR, THRIPUNITHURA, ERNAKULAM, KL 682306.</p>
                          </div>
                      </div>
                      <h2 class="payslip-title">Payslip for the month of ${mp.payedFor ?? ''}</h2>
                      <table class="company-info">
                          <tr>
                              <td>
                                <div style="display: flex; align-items: center; width: 100%;">
                                  <span style="flex: 1;">Name</span>
                                  <span style="width: 20px; text-align: center;">:</span>
                                  <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.name ?? ''}</span>
                                </div>
                              </td>
                              <td>
                                <div style="display: flex; align-items: center; width: 100%;">
                                  <span style="flex: 1;">Employee No</span>
                                  <span style="width: 20px; text-align: center;">:</span>
                                  <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.empNo ?? ''}</span>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <div style="display: flex; align-items: center; width: 100%;">
                                  <span style="flex: 1;">Joining Date</span>
                                  <span style="width: 20px; text-align: center;">:</span>
                                  <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.userpersonal[0]?.dateOfJoining ?? ''}</span>
                                </div>
                              </td>
                              <td>
                                <div style="display: flex; align-items: center; width: 100%;">
                                  <span style="flex: 1;">Bank Name</span>
                                  <span style="width: 20px; text-align: center;">:</span>
                                  <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.useraccount?.bankName ?? ''}</span>
                                </div>
                              </td>
                            </tr>
                          <tr>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">Designation</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.userPosition?.designation?.designationName ?? ''}</span>
                                    </div>
                              </td>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">Bank Account No</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.useraccount?.accountNo ?? ''}</span>
                                    </div>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">Department</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.userPosition?.department?.name ?? ''}</span>
                                  </div>
                              </td>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">PAN Number</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.statutoryinfo?.panNumber ?? ''}</span>
                                  </div>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">Location</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.userPosition?.location ?? ''}</span>
                                  </div>
                              </td>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">PF No</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.statutoryinfo?.pfNumber ?? ''}</span>
                                  </div>
                              </td>
                          </tr>
                          <tr>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">Effective Work Days</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${workingDays}</span>
                                  </div>
                              </td>
                              <td>
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">PF UAN</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.user.statutoryinfo?.uanNumber ?? ''}</span>
                                  </div>
                              </td>
                          </tr>
                          <tr>
                              <td> 
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">LOP</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.leaveDays ?? ''}</span>
                                  </div>
                              </td>
                              <td>
                                ${payedForWithoutYear === 'December' ? `
                                  <div style="display: flex; align-items: center; width: 100%;">
                                      <span style="flex: 1;">Earned Leaves</span>
                                      <span style="width: 20px; text-align: center;">:</span>
                                      <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">${mp.leaveEncashment ?? ''}</span>
                                  </div>` : ''
                                }
                              </td>
                          </tr>       
                      </table>

                      <div class="section-title">Earnings and Deductions</div>

                      <table class="earnings-deductions">
                          <thead>
                              <tr>
                                  <th>Earnings</th>
                                  <th>Full</th>
                                  <th>Actual</th>
                                  <th>Deductions</th>
                                  <th>Actual</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td>BASIC</td>
                                  <td>${fullValue.basic ?? ''}</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.basic ?? ''}</td>
                                  <td>PF</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.pfDeduction ?? ''}</td>
                              </tr>
                              <tr>
                                  <td>HRA</td>
                                  <td>${fullValue.hra ?? ''}</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.hra ?? ''}</td>
                                  <td>TDS</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.tds ?? ''}</td>
                              </tr>
                              <tr>
                                  <td>SPECIAL ALLOWANCE</td>
                                  <td>${fullValue.specialAllowance ?? ''}</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.specialAllowance ?? ''}</td>
                                  <td>Advance</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.advanceAmount ?? ''}</td>
                              </tr>
                              <tr>
                                  <td>CONVEYANCE ALLOWANCE</td>
                                  <td>${fullValue.conveyanceAllowance ?? ''}</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.conveyanceAllowance ?? ''}</td>
                                  <td>LOP</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.leaveDeduction ?? ''}</td>
                              </tr>
                              <tr>
                                  <td>TRAVEL ALLOWANCE</td>
                                  <td>${fullValue.lta ?? ''}</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.lta ?? ''}</td>
                                  <td>ESI</td>
                                  <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.esi ?? ''}</td>
                              </tr>
                              <tr>
                                <td>OVER TIME</td>
                                <td></td>
                                <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.ot ?? ''}</td>
                                <td>INCENTIVE</td>
                                <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.incentiveDeduction ?? ''}</td>
                            </tr>
                            <tr>
                              <td>PAY OUT</td>
                              <td></td>
                              <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.payOut ?? ''}</td>
                              <td></td>
                              <td></td>
                            </tr>
                            <tr>
                              <td>INCENTIVE</td>
                              <td></td>
                              <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.incentive ?? ''}</td>
                              <td></td>
                              <td></td>
                            </tr>
                            ${payedForWithoutYear === 'December' ? `
                            <tr>
                              <td>Earned Leave</td>
                              <td></td>
                              <td style="font-weight: bolder; color: rgb(8, 72, 115);">${mp.leaveEncashmentAmount ?? ''}</td>
                              <td></td>
                              <td></td>
                            </tr>` : ''}

                              <tr>
                                  <td colspan="3"> 
                                      <div style="display: flex; align-items: center; width: 100%;">
                                          <span style="flex: 1;">Total Earnings</span>
                                          <span style="width: 20px; text-align: center;">:</span>
                                          <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">INR ${totalEarnings ?? ''}</span>
                                      </div>
                                  </td>
                                  <td colspan="2"> 
                                      <div style="display: flex; align-items: center; width: 100%;">
                                          <span style="flex: 1;">Total Deductions</span>
                                          <span style="width: 20px; text-align: center;">:</span>
                                          <span style="flex: 1; font-weight: bolder; color: rgb(8, 72, 115);">INR ${totalDeductions ?? ''}</span>
                                      </div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>

                      <div class="net-pay">
                          <p>Net Pay for the month (Total Earnings - Total Deductions): <a  style="font-weight: bolder; color: rgb(8, 72, 115);">INR ${mp.toPay ?? 0}</a></p>
                          <p><a  style="font-weight: bolder; color: rgb(8, 72, 115);">(Rupees ${convertNumberToWords(totalEarnings - totalDeductions) ?? ''} Only)</a></p>
                      </div>

                      <!-- <div class="footer">
                          <p>This is a system-generated payslip and does not require a signature.</p>
                      </div> -->
                  </div>
            </body>
          </html>
          `;
          const pdfBuffer = await generatePDF(pdfContent);
    
          // Send email with payslip
          await sendPayrollEmail(
            mp.user.email,
            pdfBuffer,
            `Payslip for - ${mp.payedFor}`,
            mp.payedFor,
            mp.user.name,
            req
          );

          const id = element.id;
          const me = `PaySlip for ${mp.payedFor} is generated`;
          const route = `/login/payroll/month-end/payslip`;
    
          await createNotification({ id, me, route, transaction });
        } catch (error) {
          console.error(`Error processing payroll for ID ${element.id}:`, error);
          throw error; // Ensure rollback on error
        }
      });
    
      // Wait for all updates and emails to complete
      await Promise.all(updatePromises);
    });
    
    res.status(200).json({ message: "Successfully updated payroll statuses and sent emails." });
  } catch (error) {
    res.send(error.message);
  }
});

// Function to generate PDF
async function generatePDF(html) {
  const browser = await puppeteer.launch({
    ignoreDefaultArgs: ['--disable-extensions'],
  });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
}

// Function to send email
async function sendPayrollEmail(to, pdfBuffer, subject, payedFor, name, req) {
    const html =  `
      <p>Attached is your payslip for the month of ${payedFor}. Please review it at your convenience.</p>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;">
    `
    const emailSubject = subject
    const fromEmail = config.email.payrollUser;
    const emailPassword = config.email.payrollPass;
    const attachments = [
      {
        filename: `PaySlip_${payedFor}_${name}.pdf`,
        content: pdfBuffer,
      },
    ]
    
    const token = req.headers.authorization?.split(' ')[1];
    try {
      await sendEmail(token, fromEmail, emailPassword, to, emailSubject, html, attachments);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

}

router.post('/send-email', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    const { email, month, payrollData } = req.body; 
    const payroll = JSON.parse(payrollData);
    for (let i = 0; i < payroll.length; i++) {
      const element = payroll[i];
      let mp = await MonthlyPayroll.findByPk(element.id);
      mp.status = 'SendforApproval';
      await mp.save();
    }
    
    let user = await User.findByPk(req.user.id, { include:[ 
      {model: UserPosition, attributes: ['designationId'], include: {
        model: Designation, attributes: ['designationName']
      }},
      {model: Role, attributes: ['roleName']}]
    });
    
    let designation;
    if(user.role.roleName !== 'Super Administrator' && user.role.roleName !== 'HR Administrator'){
      if(!user.userPosition || !user.userPosition.designationId){
        return res.send(`Designation of the sender ${user.name} is not added`)
      }
      designation = user.userPosition.designation.designationName;
    }else{
      designation = user.role.roleName;
    } 
    
    const file = req.file;
    
          // <a href="https://api-approval.techclaire.com/monthlypayroll/approve?month=${month}&id=${req.user.id}" 
    const html =  `
      <p>Please find the attached payroll Excel file for your review.</p>
        <p>Kindly click the button below to either approve or reject the payroll data as required.</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://api-approval.techclaire.com/monthlypayroll/approve?month=${month}&id=${req.user.id}" 
            style="
              display: inline-block;
              padding: 10px 20px;
              margin: 5px;
              font-size: 16px;
              color: white;
              background-color: #28a745;
              text-decoration: none;
              border-radius: 5px;
            ">
            Approve
          </a>
          <a href="https://api-approval.techclaire.com/monthlypayroll/reject?month=${month}&id=${req.user.id}" 
            style="
              display: inline-block;
              padding: 10px 20px;
              margin: 5px;
              font-size: 16px;
              color: white;
              background-color: #dc3545;
              text-decoration: none;
              border-radius: 5px;
            ">
            Reject
          </a>
        </div>
        <br/>
    `
    const emailSubject = `Payroll Data for ${month}`
    const fromEmail = config.email.payrollUser;
    const emailPassword = config.email.payrollPass;
    const attachments = 
      {
        filename: file.originalname,
        path: file.path,  
      }
    
    const token = req.headers.authorization?.split(' ')[1];
    try {
      await sendEmail(token, fromEmail, emailPassword, email, emailSubject, html, attachments);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    fs.unlinkSync(file.path);

    res.send({ message: 'Email sent successfully!' });
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/approve', async (req, res) => {
  try {
    const { month, id } = req.query;
    const payrolls = await MonthlyPayroll.findAll({ where: { payedFor: month, status: 'SendforApproval' } });
    if (payrolls.length === 0) {
      return res.send("Already proccesed request")
    }
    payrolls.forEach(async (payroll) => {
      payroll.status = 'Approved';
      await payroll.save();
    });
    const me = `Payroll for ${month} is approved`;
    const route = `/login/payroll/month-end`;

    await createNotification({ id, me, route });
    // const not = await Notification.create({
    //   userId: id, message:`Payroll for ${month} is approved`, isRead: false, route: `/login/payroll/month-end`
    // })
    
    res.send(`Payroll for ${month} is approved`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Reject Route
router.get('/reject', async (req, res) => {
  try {
    const { month, id } = req.query;
    const payrolls = await MonthlyPayroll.findAll({ where: { payedFor: month, status: 'SendforApproval' } });
    if (payrolls.length === 0) {
      return res.send("Already proccesed request")
    }
    payrolls.forEach(async (payroll) => {
      payroll.status = 'Rejected';
      await payroll.save();
    });
    const me = `Payroll for ${month} is rejected`;
    const route = `/login/payroll/month-end`;

    await createNotification({ id, me, route });
    res.send(`Payroll for ${month} is rejected`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get('/ytd', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      const monthlyPayroll = await MonthlyPayroll.findAll({
        include: [{ model: User, attributes: ['name'] }]
      });
      return res.send(monthlyPayroll);
    }

    const parsedFromDate = new Date(fromDate);
    const parsedToDate = new Date(toDate);

    const monthlyPayroll = await MonthlyPayroll.findAll({
      where: {
        payedAt: {
          [Op.gte]: parsedFromDate, // Use Op instead of sequelize.Op
          [Op.lte]: parsedToDate,
        }
      },
      include: [{ model: User, attributes: ['name'] }] // Include related User model
    });
    res.send(monthlyPayroll);

  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;