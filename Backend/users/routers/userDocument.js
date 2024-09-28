const express = require('express');
const router = express.Router();
const upload = require('../../utils/userDocumentMulter'); // Import the configured multer instance
const authenticateToken = require('../../middleware/authorization');
const s3 = require('../../utils/s3bucket');
const UserDocument = require('../models/userDocuments');


router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.send({ message: 'No file uploaded' });
    }
    
    const customFileName = req.body.name || req.file.originalname;  
    const sanitizedFileName = customFileName.replace(/[^a-zA-Z0-9]/g, '_');

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `users/${Date.now()}_${sanitizedFileName}`,
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
    res.status(500).send({ message: error.message });
  }
});

router.post('/add', authenticateToken, async (req, res) => {
  try {
          const { userId, docName, docUrl } = req.body;

          const user = new UserDocument({userId, docName, docUrl});

          await user.save();

          res.send(user);

  } catch (error) {
      res.send(error.message);
  }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserDocument.findAll({where: {userId: req.params.id}})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;