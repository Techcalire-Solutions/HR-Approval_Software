/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Role = require('../models/role')
const { Op } = require('sequelize');
const sequelize = require('../../utils/db');
const upload = require('../../utils/userImageMulter'); 
const s3 = require('../../utils/s3bucket');
const UserLeave = require('../../leave/models/userLeave');
const LeaveType = require('../../leave/models/leaveType');
const UserPersonal = require('../models/userPersonal');
const UserPosition = require('../models/userPosition');
const Designation = require('../models/designation');
const StatutoryInfo = require('../models/statutoryInfo');
const UserDocument = require('../models/userDocuments');
const { sendEmail } = require('../../app/emailService');
const config = require('../../utils/config')

router.post('/add', async (req, res) => {
  const { name, email, phoneNumber, password, status, userImage, url, empNo, director } = req.body;

  try {
    let roleId = req.body.roleId;
    if(roleId === '' || roleId === null || roleId === undefined){
      try {
        const role = await Role.findOne({ where: {roleName: 'Employee'}})
        roleId = role.id;
      } catch (error) {
        res.send(error.message)
      }
    }

    const userExist = await User.findOne({
      where: {
        [Op.or]: [
          { email: email, roleId: roleId },
          { empNo: empNo, roleId: roleId }
        ]
      }
    });
    
    if (userExist) {
      return res.send(`User already exists with the email or employee number and Role`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, empNo, email, phoneNumber, password: hashedPassword, roleId, status, userImage, url, director
    });

    // const emailText = `Dear ${user.name},\n\nCongratulations on joining our company!\nHere are your login credentials:\n\nUsername: ${user.empNo}\nPassword: ${password}\n\nPlease keep this information secure.\n\nWe are excited to have you onboard and look forward to working together.\n\nBest Regards,\nThe Team`;
    const emailSubject = `Welcome to the Company!`;
    const fromEmail = config.email.userAddUser;
    const emailPassword = config.email.userAddPass;
    const html = `
    <p>Dear ${user.name},</p>
    <p>Congratulations on joining our company!.</p>
    <p>Here are your login credentials:</p>
    <p>Username: ${user.empNo}\nPassword: ${password}</p>
    <p>Please keep this information secure.</p>
    <p>We are excited to have you onboard and look forward to working together.</p>
  `;
    const attachments = []
    const token = req.headers.authorization?.split(' ')[1];
    try {
      await sendEmail(token, fromEmail, emailPassword, user.email, emailSubject, html, attachments);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/find/', async (req, res) => {
  try {
    let whereClause = { separated: false, status: true };
    let limit;
    let offset;

    if (req.query.search && req.query.search !== 'undefined') {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        [Op.and]: [
          {
            [Op.or]: [
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('phoneNumber'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('email'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('statutoryinfo.adharNo'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              ),
              sequelize.where(
                sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('statutoryinfo.panNumber'), ' ', '')),
                { [Op.like]: `%${searchTerm}%` }
              )
            ]
          },
          { status: true },
          { separated: false }
        ]
      };
    } else {
      if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
        limit = parseInt(req.query.pageSize, 10);
        offset = (parseInt(req.query.page, 10) - 1) * limit;
      }
    }

    // Fetch paginated data
    const users = await User.findAll({
      where: whereClause,
      order: [['id']],
      include: [
        { model: Role, as: 'role', attributes: ['id', 'roleName'] },
        { model: StatutoryInfo, as: 'statutoryinfo', required: false }, // Ensure alias matches the association
        {
          model: UserPosition,
          attributes: ['designationId'],
          include: [{ model: Designation, attributes: ['designationName'] }]
        }
      ],
      limit,
      offset
    });

    // Count total records that match the search condition
    const totalCount = await User.count({
      where: whereClause,
      include: [
        { model: StatutoryInfo, as: 'statutoryinfo', required: false } // Ensure consistent inclusion
      ]
    });

    // Return the response
    if (req.query.page !== 'undefined' && req.query.pageSize !== 'undefined') {
      const response = {
        count: totalCount,
        items: users // Paginated data
      };

      res.json(response);
    } else {
      res.send(users);
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/search/name', async (req, res) => {
  try {
    let whereClause = {};
    if (req.query.search) {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      whereClause = {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('LOWER', sequelize.col('name')),
            {
              [Op.like]: `%${searchTerm}%`
            }
          )
        ]
      };
    }

    const result = await User.findAll({
      where: whereClause,
      order: [["id", "ASC"]]
    });

    res.send(result); // Send the results to the client
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/statusupdate/:id', async (req, res) => {
  try {
    let status = req.body.status;
    let result = await User.findByPk(req.params.id);
    result.status = status
    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/findone/:id', async (req, res) => {
  let id = req.params.id;
  
  try {
    const user = await User.findByPk(id, {
      include: [
        { model: Role, attributes: ['id', 'roleName'] },
        { model: UserPosition, attributes: ['designationId'],
            include: [{ model: Designation, include: {model: Role} }]
        }
      ]
    });
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { name, email, phoneNumber, url} = req.body;
  // const pass = await bcrypt.hash(password, 10);
  try {
    let result = await User.findByPk(req.params.id);
    result.name = name;
    result.email = email;
    result.phoneNumber = phoneNumber;
    result.url = url

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

router.patch('/imageupdate/:id', async(req,res)=>{
  const {url} = req.body;
  try {
    let result = await User.findByPk(req.params.id);
    result.url = url

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const id = req.params.id
  try {
    const user = await User.findByPk(id)
    const fileKey = user.url;

    if(fileKey){
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };
      await s3.deleteObject(deleteParams).promise();
    }

    const userDoc = await UserDocument.findAll({ where: {userId: user.id} });
    if(userDoc.length > 0){
        for(let i = 0; i < userDoc.length; i++) {
          const docKey = userDoc[i].docUrl;
          const deleteParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: docKey
          };
          await s3.deleteObject(deleteParams).promise();
        }
    }

    const result = await user.destroy({
      force: true
    });
    if (result === 0) {
      return res.json({
        status: "fail",
        message: "User with that ID not found",
      });
    }

    res.status(204).json();
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/findbyrole/:id', async (req, res) => {
  try {
    const user = await User.findAll({
      where: { roleId: req.params.id, separated: false }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/findbyroleName/:roleName', async (req, res) => {
  try {
    const users = await User.findAll({
      include: { model: Role, where: [{ roleName: req.params.roleName} ] },
      where: { separated: false }
    });

    res.send(users);
  } catch (error) {
    res.send(error.message );
  }
});

router.get('/getdirectors', async (req, res) => {
  try {
    const user = await User.findAll({
      where: { director: true }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/getseparated', async (req, res) => {
  try {
    const user = await User.findAll({
      where: { separated: true },
      include: [{ model: Role, attributes: ['roleName']}]
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/getbyrm/:id', async (req, res) => {
  try {
    
    const id = parseInt(req.params.id, 10)

    const users = await User.findAll({
      include: [
        {
          model: UserPersonal, as: 'userpersonal',
          required: true, // Only include users with a matching UserPersonal record
          where: {
            reportingMangerId: { [Op.ne]: null },
            reportingMangerId: id
          },
        },
      ],
    });

    res.send(users); // Send the retrieved users
  } catch (error) {
    res.send(error.message); // Send error message
  }
});

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.send('No file uploaded');
    }

    // Sanitize the original file name by removing special characters and spaces
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');

    // Create S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `Users/Images/${Date.now()}_${sanitizedFileName}`, // File path with sanitized name
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read' // Optional: make file publicly accessible
    };

    const data = await s3.upload(params).promise();

    const fileUrl = data.Location ? data.Location : '';

    // Replace only if fileUrl is valid
    const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;

    res.status(200).send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: key // S3 URL of the uploaded file
    });
  } catch (error) {
    res.send(error.message );
  }
});

router.delete('/filedelete', authenticateToken, async (req, res) => {
  let id = req.query.id;
  try {
    try {
        let user = await User.findByPk(id);
        fileKey = user.url;
        user.url = '';
        await user.save();
    } catch (error) {
      res.send(error.message)
    }
    let key;
    if (!fileKey) {
      key = req.query.key;
      
      fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    }

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.send('File deleted successfully' );
  } catch (error) {
    res.send(error.message );
  }
});

router.delete('/filedeletebyurl', authenticateToken, async (req, res) => {
    key = req.query.key;
    fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    try {
      if (!fileKey) {
        return res.send({ message: 'No file key provided' });
      }

      // Set S3 delete parameters
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };

      // Delete the file from S3
      await s3.deleteObject(deleteParams).promise();

      res.send( 'File deleted successfully' );
    } catch (error) {
      res.send(error.message );
    }
});

router.patch('/resetpassword/:id', async (req, res) => {
  const { password, paswordReset } = req.body;

  try {
      const hashedPassword = await bcrypt.hash(password, 10);
      let user = await User.findByPk(req.params.id);
      
      if (!user) {
          return res.send('User not found');
      }

      user.password = hashedPassword;
      user.paswordReset = paswordReset;

      await user.save();
      
      // const emailText = `Hello ${user.name},\n\nYour password has been successfully reset.\n\nUsername: ${user.empNo}\nPassword: ${password}\n\nPlease keep this information safe.\n\nThank you!`;
      const emailSubject = `Password Reset Successful`;
      const fromEmail = config.email.userAddUser;
      const emailPassword = config.email.userAddPass;    
      const html = `
        <p>Dear ${user.name},</p>
        <p>Your password has been successfully reset!.</p>
        <p>Here are your login credentials:</p>
        <p>Username: ${user.empNo}\nPassword: ${password}</p>
        <p>Please keep this information secure.</p>
        <p>Thank you!</p>
      `;
      const attachments = []
      const token = req.headers.authorization?.split(' ')[1];
      try {
        await sendEmail(token, fromEmail, emailPassword, user.email, emailSubject ,html, attachments);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
    
      }

      //   // Configure Nodemailer for sending emails
      // const transporter = nodemailer.createTransport({
      //     service: 'Gmail', 
      //     auth: {
      //       user: 'nishida@onboardaero.com',
      //       pass: 'jior rtdu epzr xadt',
      //     },
      // });

      // // Email options
      // const mailOptions = {
      //     from: 'nishida@onboardaero.com', // Replace with your email
      //     to: user.email, // Assuming the User model has an `email` field
      //     subject: 'Password Reset Successful',
      //     text: `Hello ${user.name},\n\nYour password has been successfully reset.\n\nUsername: ${user.empNo}\nPassword: ${password}\n\nPlease keep this information safe.\n\nThank you!`,
      // };

      // // Send the email
      // transporter.sendMail(mailOptions, (err, info) => {
      //     if (err) {
      //         console.error('Error sending email:', err);
      //         return res.send('Failed to send email');
      //     } else {
      //         console.log('Email sent:', info.response);
      //         res.send('Password reset successful and email sent');
      //     }
      // });
      
      res.send(user);
  } catch (error) {
      res.send(error.message);
  }
});

router.get('/underprobation', async (req, res) => {
  try {
    const user = await User.findAll({
      include: [
        {
          model: Role,
          attributes: ['roleName']
        },
      ], order: [['name', 'ASC']], 
      where: { isTemporary: true, separated: false }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/confirmed', async (req, res) => {
  try {
    const user = await User.findAll({
      include: [
        {
          model: Role,
          attributes: ['roleName']
        },
      ],
      where: { isTemporary: false, separated: false }, order: [['name', 'ASC']], 
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/confirmemployee/:id', async (req, res) => {
  try {
      let result = await User.findByPk(req.params.id);

      let post = await UserPosition.findOne({
        where: { userId: req.params.id}
      })
      if(!post){
        return res.send(`Employment data is not added for the employee ${result.name}`)
      }
      post.probationNote = req.query.note;
      post.confirmationDate = new Date();
      await post.save();
      
      if (!result) {
        return res.json({ message: "Employee not found" });
      }

      result.isTemporary = false;
      await result.save();

      const leaveTypes = await LeaveType.findAll({});
      const sl = leaveTypes.find(x => x.leaveTypeName === 'Sick Leave');
      const cl = leaveTypes.find(x => x.leaveTypeName === 'Casual Leave');
      const co = leaveTypes.find(x => x.leaveTypeName === 'Comb Off');
      const slId = sl ? sl.id : null;
      const clId = cl ? cl.id : null;
      const coId = co ? co.id : null;
      const currentYear = new Date().getFullYear();
      
      let data = [
        {userId: req.params.id, leaveTypeId: slId, noOfDays : 1, leaveBalance : 1, year: currentYear},
        {userId: req.params.id, leaveTypeId: clId, noOfDays : 1, leaveBalance : 1, year: currentYear},
        {userId: req.params.id, leaveTypeId: coId, noOfDays : 0, leaveBalance : 0, year: currentYear},
      ]

      for(let i = 0; i < data.length; i++){
        UserLeave.bulkCreate([data[i]]);
      }

      res.json({ message: "Employee confirmed" });
  } catch (error) {
      res.send(error.message );
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users); 
  } catch (error) {
    res.send( error.message );
  }
});

router.patch('/resignemployee/:id', async (req, res) => {
  try {
      let result = await User.findByPk(req.params.id);
      
      if (!result) {
          return res.json({ message: "Employee not found" });
      }
      
      result.separated = req.body.confirmed;
      result.status = !req.body.confirmed;
      result.separationNote = req.body.note;
      result.separationDate = req.body.date;
      await result.save();
      res.json({ result });
  } catch (error) {
      res.send(error.message );
  }
});

router.patch('/editnote/:id', async (req, res) => {
  try {
      let result = await User.findByPk(req.params.id);
      
      if (!result) {
          return res.json({ message: "Employee not found" });
      }
      result.separationNote = req.body.note;
      result.separationDate = req.body.date;
      await result.save();
      res.json({ result });
  } catch (error) {
      res.send( error.message);
  }
});
module.exports = router;
