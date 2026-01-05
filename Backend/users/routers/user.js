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

router.post('/add', authenticateToken, async (req, res) => {
  const { name, email, phoneNumber, password, status, userImage, url, empNo, director, officialMailId } = req.body;

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
          { empNo: empNo }
        ]
      }
    });
    
    if (userExist) {
      return res.send(`User already exists with the email or employee number`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, empNo, email, phoneNumber, password: hashedPassword, roleId, status, userImage, url, director
    });

    if(officialMailId){
      const emailSubject = `Welcome to the Company!`;
      const fromEmail = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASS;
      const frontEndUrl = process.env.FRONT_END;
      const html = `
        <p>Dear ${name},</p>
        <p>Congratulations on joining our company!.</p>
        <p>Here are your login credentials:</p>
        <p>Username: ${empNo}\nPassword: ${password}</p>
        <p>Please keep this information secure.</p>
        <p>You can log in here: <a href="${frontEndUrl}" target="_blank">${frontEndUrl}</a></p>
        <p>We are excited to have you onboard and look forward to working together.</p>
      `;
      const attachments = []
      const token = req.headers.authorization?.split(' ')[1];
      try {
        await sendEmail(token, fromEmail, emailPassword, officialMailId, emailSubject, html, attachments);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      const userPos = new UserPosition({userId: user.id, officialMailId: officialMailId})
      await userPos.save();
    }

    
    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/find/', authenticateToken, async (req, res) => {
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

router.get('/search/name', authenticateToken, async (req, res) => {
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

router.patch('/statusupdate/:id', authenticateToken, async (req, res) => {
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

router.get('/findone/:id', authenticateToken, async (req, res) => {
  let id = req.params.id;
  
  try {
    const user = await User.findByPk(id, {
      include: [
        { model: Role, attributes: ['id', 'roleName'] },
        { model: UserPosition, attributes: ['designationId'],
            include: [{ model: Designation, include: {model: Role} }]
        },
        { model: UserPersonal, as: 'userpersonal', attributes: ['dateOfBirth'] }
      ]
    });
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { name, email, phoneNumber, url, empNo} = req.body;
  // const pass = await bcrypt.hash(password, 10);
  try {
    let result = await User.findByPk(req.params.id);
    result.name = name;
    result.email = email;
    result.phoneNumber = phoneNumber;
    result.url = url;
    result.empNo = empNo;
    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

router.patch('/imageupdate/:id', authenticateToken, async(req,res)=>{
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

router.delete('/delete/:id',  authenticateToken, async (req, res) => {
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

router.get('/findbyrole/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findAll({
      where: { roleId: req.params.id, separated: false }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/findbyroleName/:roleName', authenticateToken, async (req, res) => {
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

router.get('/getdirectors', authenticateToken, async (req, res) => {
  try {
    const user = await User.findAll({
      where: { director: true }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/getseparated', authenticateToken, async (req, res) => {
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

router.get('/getbyrm/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const users = await User.findAll({
      where: {
        separated: false, // Filter users who are not separated
      },
      include: [
        {
          model: UserPersonal,
          as: 'userpersonal',
          required: true, // Ensures only users with a UserPersonal record are included
          where: {
            reportingMangerId: id, // Filter by reporting manager ID
          },
        },
      ],
    });

    res.send(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// router.get('/getbyrm/:id', authenticateToken, async (req, res) => {
//   try {
    
//     const id = parseInt(req.params.id, 10)

//     const users = await User.findAll({
//       include: [
//         {
//           model: UserPersonal, as: 'userpersonal',
//           required: true, // Only include users with a matching UserPersonal record
//           where: {
//             reportingMangerId: { [Op.ne]: null },
//             reportingMangerId: id, 
//           },
//         },
//       ],
//     });

//     res.send(users); // Send the retrieved users
//   } catch (error) {
//     res.send(error.message); // Send error message
//   }
// });

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.send('No file uploaded or invalid file type');
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
  const id = req.query.id;
  let fileKey;

  try {
    if (id) {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      fileKey = user.url;
      user.url = '';
      await user.save();
    }

    if (!fileKey) {
      const key = req.query.key;
      fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    }

    if (!fileKey) {
      return res.json({ message: "File key is missing" });
    }

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey,
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("File delete error:", error);
    res.json({ error: error.message });
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

router.patch('/resetpassword/:id', authenticateToken, async (req, res) => {
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
      
      const userPos = await UserPosition.findOne({ where: {userId: user.id}});
      const email = userPos.officialMailId;
      // const emailText = `Hello ${user.name},\n\nYour password has been successfully reset.\n\nUsername: ${user.empNo}\nPassword: ${password}\n\nPlease keep this information safe.\n\nThank you!`;
      const emailSubject = `Password Reset Successful`;
      const fromEmail = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASS;    
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
        await sendEmail(token, fromEmail, emailPassword, email, emailSubject ,html, attachments);
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

router.get('/underprobation', authenticateToken, async (req, res) => {
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

router.get('/confirmed', authenticateToken, async (req, res) => {
  try {
    const user = await User.findAll({
      include: [
        {
          model: Role,
          attributes: ['roleName']
        },
        {
          model: UserPosition,  
          attributes: ['officialMailId'], // Include official email
        },
      ],
      where: { isTemporary: false, separated: false }, order: [['name', 'ASC']], 
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})
router.get('/confirmemployee/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const currentYear = new Date().getFullYear();

    // 1️⃣ Get employee
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // 2️⃣ Get employment details
    const post = await UserPosition.findOne({
      where: { userId }
    });

    if (!post) {
      return res
        .status(400)
        .json({ message: `Employment data is not added for ${user.name}` });
    }

    // 3️⃣ Prevent reconfirming
    if (!user.isTemporary) {
      return res.json({ message: "Employee is already confirmed." });
    }

    // 4️⃣ Update employment details
    post.probationNote = req.query.note || null;
    post.confirmationDate = new Date();
    await post.save();

    // 5️⃣ Confirm employee
    user.isTemporary = false;
    await user.save();

    // 6️⃣ Get leave types
    const leaveTypes = await LeaveType.findAll();
    const leaveTypeMap = {};

    leaveTypes.forEach(lt => {
      leaveTypeMap[lt.leaveTypeName] = lt.id;
    });

    const slId = leaveTypeMap['Sick Leave'];
    const clId = leaveTypeMap['Casual Leave'];
    const coId = leaveTypeMap['Comp Off'];

    // 7️⃣ Leave data
    const leaveData = [
      { leaveTypeId: slId, noOfDays: 1, leaveBalance: 1 },
      { leaveTypeId: clId, noOfDays: 1, leaveBalance: 1 },
      { leaveTypeId: coId, noOfDays: 0, leaveBalance: 0 }
    ];

    // 8️⃣ Create or update leave balances (NO DUPLICATES)
    for (const leave of leaveData) {
      if (!leave.leaveTypeId) continue;

      await UserLeave.upsert({
        userId,
        leaveTypeId: leave.leaveTypeId,
        year: currentYear,
        noOfDays: leave.noOfDays,
        leaveBalance: leave.leaveBalance
      });
    }

    // 9️⃣ Response
    return res.json({
      message: `${user.name} is confirmed successfully.`
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

// router.get('/confirmemployee/:id', authenticateToken, async (req, res) => {
//   try {
//       let result = await User.findByPk(req.params.id);

//       let post = await UserPosition.findOne({
//         where: { userId: req.params.id}
//       })
//       if(!post){
//         return res.send(`Employment data is not added for the employee ${result.name}`)
//       }
//       post.probationNote = req.query.note;
//       post.confirmationDate = new Date();
//       await post.save();
      
//       if (!result) {
//         return res.json({ message: "Employee not found" });
//       }
      
//       result.isTemporary = !result.isTemporary;
//       await result.save();

//       const leaveTypes = await LeaveType.findAll({});
//       const sl = leaveTypes.find(x => x.leaveTypeName === 'Sick Leave');
//       const cl = leaveTypes.find(x => x.leaveTypeName === 'Casual Leave');
//       const co = leaveTypes.find(x => x.leaveTypeName === 'Comp Off');
//       const slId = sl ? sl.id : null;
//       const clId = cl ? cl.id : null;
//       const coId = co ? co.id : null;
//       const currentYear = new Date().getFullYear();
      
//       let data = [
//         {userId: req.params.id, leaveTypeId: slId, noOfDays : 1, leaveBalance : 1, year: currentYear},
//         {userId: req.params.id, leaveTypeId: clId, noOfDays : 1, leaveBalance : 1, year: currentYear},
//         {userId: req.params.id, leaveTypeId: coId, noOfDays : 0, leaveBalance : 0, year: currentYear},
//       ]

//       for(let i = 0; i < data.length; i++){
//         UserLeave.bulkCreate([data[i]]);
//       }
//       if (result.isTemporary) {
//         res.json({ message: " is currently under probation." });
//       } else {
//         res.json({ message: " is confirmed." });
//       }
//   } catch (error) {
//       res.send(error.message );
//   }
// });

router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users); 
  } catch (error) {
    res.send( error.message );
  }
});

router.patch('/resignemployee/:id', authenticateToken, async (req, res) => {
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

router.patch('/editnote/:id', authenticateToken, async (req, res) => {
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
