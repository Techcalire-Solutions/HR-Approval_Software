const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Role = require('../models/role')
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../../utils/db');
const multer = require('../../utils/userImageMulter'); // Import the configured multer instance
const Team = require('../models/team')
const TeamMember = require('../models/teamMember');
const upload = require('../../utils/userImageMulter'); 
const s3 = require('../../utils/s3bucket')

router.post('/add', async (req, res) => {
  const { name, email, phoneNumber, password, roleId, status, userImage, url, teamId, empNo } = req.body;

  try {
    // Check if user exists by email/role or empNo/role
    const userExist = await User.findOne({
      where: {
        [Op.or]: [
          { email: email, roleId: roleId },
          { empNo: empNo, roleId: roleId }
        ]
      }
    });

    if (userExist) {
      return res.status(400).send(`User already exists with the email or employee number and Role`);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await User.create({
      name, empNo, email, phoneNumber, password: hashedPassword, roleId, status, userImage, url, teamId
    });

    // Verify the team exists
    if (teamId!=null){
        const team = await Team.findOne({ where: { id: teamId } });

        if (!team) {
          return res.status(404).send('Team not found');
        }
        const teamMember = await TeamMember.create({
          teamId: team.id,
          userId: user.id
        });
        res.send({ user, teamMember })
    } else {
      res.json({ user: user });
    }

  } catch (error) {
    console.error('Error:', error.message);
    res.send('Server error');
  }
});

router.get('/find/', async (req, res) => {
  try {
    let whereClause = {}
    let limit;
    let offset;
    if (req.query.pageSize && req.query.page && req.query.pageSize != 'undefined' && req.query.page != 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('phoneNumber'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('email'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('role.roleName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        };
      }
    } else {
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ],
          status: true
        };
      } else {
        whereClause = {
          status: true
        };
      }
    }

    const users = await User.findAll({
      where: whereClause,
      include: [
        { model: Role, as: 'role', attributes: ['id', 'roleName'] }
      ],
      order: ["id"],
      limit,
      offset
    });

    let totalCount;
    totalCount = await User.count();

    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: users,
      };

      res.json(response);
    } else {
      res.json(users);
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
      include: {
        model: Role,
        attributes: ['id', 'roleName']
      }
    });
    res.send(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { name, email, phoneNumber, roleId} = req.body;
  // const pass = await bcrypt.hash(password, 10);
  try {
    let result = await User.findByPk(req.params.id);
    result.name = name;
    result.email = email;
    result.phoneNumber = phoneNumber;
    // result.password = pass;
    result.roleId = roleId;

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

    const result = await user.destroy({
      force: true
    });
    if (result === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Brand with that ID not found",
      });
    }

    res.status(204).json();
  } catch (error) {
    res.send(error.message)
  }
})

// router.post('/fileupload', multer.single('file'), authenticateToken, (req, res) => {
//   try {

//     if (!req.file) {
//       return res.status(400).send({ message: 'No file uploaded' });
//     }
//     console.log(req.file);
    
//     // Construct the URL path
//     const fileUrl = `/users/userImages/${req.file.originalname}`;

//     res.status(200).send({
//       message: 'File uploaded successfully',
//       file: req.file,
//       fileUrl: fileUrl
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).send({ message: error.message });
//   }
// });

// router.delete('/filedelete/:id', async (req, res) => {
//   let id = req.params.id;
//   try {
//     const pi = await PerformaInvoice.findByPk(id);
//     let filename = pi.url
//     const directoryPath = path.join(__dirname, '../userImages'); // Replace 'uploads' with your folder name
//     const filePath = path.join(directoryPath, filename);

//     fs.access(filePath, fs.constants.F_OK, (err) => {
//       if (err) {
//         return res.status(404).json({ message: 'File not found' });
//       }

//       // Delete the file
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           return res.status(500).json({ message: 'Error deleting file' });
//         }

//         return res.status(200).json({ message: 'File deleted successfully' });
//       });
//     })
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).send({ message: error.message });
//   }
// });

router.get('/findbyrole/:id', async (req, res) => {
  try {
    const user = await User.findAll({
      where: { roleId: req.params.id }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/getreportingmanager', async (req, res) => {
  try {
    const user = await User.findAll({
      where: { reportingManager: true }
    })
    res.send(user);
  } catch (error) {
    res.send(error.message)
  }
})

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
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

    // Upload the file to S3
    const data = await s3.upload(params).promise();

    // Check if data.Location (fileUrl) exists
    const fileUrl = data.Location ? data.Location : '';

    // Replace only if fileUrl is valid
    const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;

    res.status(200).send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: key // S3 URL of the uploaded file
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    res.send({ message: error.message });
  }
});

router.delete('/filedelete/:id', authenticateToken, async (req, res) => {
  let id = req.params.id;
  try {
    try {
        let user = await User.findByPk(id);
        fileKey = user.url
        user.url = '';

        await user.save();
    } catch (error) {
      res.send(error.message)
    }
    if (!fileKey) {
      return res.status(400).send({ message: 'No file key provided' });
    }

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey // The key (path) of the file to delete
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.status(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).send({ message: error.message });
  }
});
module.exports = router;
