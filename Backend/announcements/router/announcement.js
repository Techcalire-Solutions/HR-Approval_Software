/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Announcement = require('../model/announcement');
const upload = require('../../utils/multer');
const s3 = require('../../utils/s3bucket');
const nodemailer = require('nodemailer');
const UserPosition = require('../../users/models/userPosition');
const User = require('../../users/models/user');
const Notification = require('../../notification/models/notification');
const config = require('../../utils/config');
const { Op } = require('sequelize');
const sequelize = require('../../utils/db');


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.announcement_user,
    pass: config.email.announcement_pwd,
  }

});

router.post('/add', authenticateToken, async (req, res) => {
  const { message, type, dismissible, fileUrl } = req.body;
  try {
    const userPosition = await UserPosition.findAll({})

    const userEmails = userPosition.map(userPosition => userPosition.officialMailId).filter(officialMailId => officialMailId);

    const users = await User.findAll({ attributes: ['id'] });

    const userIds = users.map(user => user.id);

    const notifications = userIds.map(userId => {
      return Notification.create({
        userId: userId,
        message: `Important Announcement - ${message}`,
        isRead: false, route: '/login/announcements'
      });
    });

    await Promise.all(notifications);
    
    const ancmnts = new Announcement({ message, type, dismissible, fileUrl });
    await ancmnts.save();

    let fileBuffer, contentType;

    if (fileUrl) {
      const fileKey = fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '');

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      };

      const s3File = await s3.getObject(params).promise();
      fileBuffer = s3File.Body;
      contentType = s3File.ContentType;
    }

    if (userEmails.length != 0) {
      const mailOptions = {
        from: `HR Department`,
        to: userEmails,
        subject: 'Important Announcement',
        html: `
            <p>Dear Team,</p>
            <p>We would like to bring to your attention the following announcement:</p>
            <p><strong style="font-size: 18px;">${message}</strong></p>
            ${fileUrl ? '<p>Find attached the file.</p>' : ''}
            <br>
            <p>Best regards,</p>
            <p>HR Department</p>
        `,
        attachments: fileBuffer ? [
          {
            filename: fileUrl.split('/').pop(),
            content: fileBuffer,
            contentType: contentType,
          }
        ] : [],
      };
  
      await transporter.sendMail(mailOptions);
    }
    res.send(ancmnts);
  } catch (error) {
    res.send( error.message );
  }
});

router.get('/find', authenticateToken, async(req, res) => {
    try {
      let whereClause = {  };
      if (req.query.search && req.query.search !== 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.and]: [
            {
              [Op.or]: [
                sequelize.where(
                  sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('message'), ' ', '')),
                  { [Op.like]: `%${searchTerm}%` }
                ),
                sequelize.where(
                  sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('type'), ' ', '')),
                  { [Op.like]: `%${searchTerm}%` }
                )
              ]
            }
          ]
        };
      }
        let ancmnts = await Announcement.findAll({ where: whereClause})
        res.send(ancmnts);
    } catch (error) {
       res.send(error.message) 
    }
})

router.delete('/delete/:id', authenticateToken, async(req, res) => {
    try {
      const ancmnt = await Announcement.findByPk(req.params.id);
      let fileKey = ancmnt.fileUrl;
      if(fileKey){
        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: fileKey
        };
    
        await s3.deleteObject(deleteParams).promise();
      }


        const result = await Announcement.destroy({
            where: { id: req.params.id },
            force: true,
        });

        if (result === 0) {
            return res.send("Role with that ID not found");
          }
      
          res.status(204).json();
        }  catch (error) {
          res.send(error.message);
    }
})

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
    try {
      if (!req.file) {
        return res.send({ message: 'No file uploaded' });
      }
      
      const customFileName = req.file.originalname;  
      const sanitizedFileName = customFileName.replace(/[^a-zA-Z0-9]/g, '_');
  
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `Announcements/${Date.now()}_${sanitizedFileName}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read'
      };
  
      const data = await s3.upload(params).promise();
  
      const fileUrl = data.Location ? data.Location : '';
      const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
  
      res.send({
        message: 'File uploaded successfully',
        file: req.file,
        fileUrl: key
      });
    } catch (error) {
      res.send(error.message );
    }
});

router.delete('/filedelete', authenticateToken, async (req, res) => {
  let id = req.query.id;
  try {
    try {
        let result = await Announcement.findByPk(id);
        fileKey = result.fileUrl ;
        result.fileUrl  = '';
        await result.save();
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

      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      res.send(error.message);
    }
});

module.exports = router;