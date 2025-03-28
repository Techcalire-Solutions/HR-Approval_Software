/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
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
      Key: `Users/documents/${Date.now()}_${sanitizedFileName}`,
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
    res.send( error.message );
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

router.patch('/update/:id', authenticateToken, async (req, res) => {
  const { docName, docUrl } = req.body;
  try {
          const userDoc = await UserDocument.findByPk(req.params.id);
          userDoc.docName = docName;
          userDoc.docUrl = docUrl;

          await userDoc.save();

          res.send(userDoc);

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

router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Find the document by its primary key
    const userDoc = await UserDocument.findByPk(id);
    if (!userDoc) {
      return res.send( "User document not found" );
    }

    await userDoc.destroy();
    res.status(200).json({ message: "User document deleted successfully" });
  } catch (error) {
    res.send(error.message);
  }
});


router.delete('/filedelete', authenticateToken, async (req, res) => {
  let id = req.query.id;
  try {
    try {
        let user = await UserDocument.findByPk(id);
        fileKey = user.docUrl;
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

    res.status(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    res.send(error.message);
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

      res.status(200).send({ message: 'File deleted successfully' });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
});
module.exports = router;