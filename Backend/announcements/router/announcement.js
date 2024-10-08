const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Announcement = require('../model/announcement');
const upload = require('../../utils/multer');
const s3 = require('../../utils/s3bucket');

router.post('/add', authenticateToken, async(req, res) => {
    const { message, type, dismissible, fileUrl } = req.body;
    
    try {
        const ancmnts = new Announcement({message, type, dismissible, fileUrl});
        await ancmnts.save();

        res.send(ancmnts);
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/find', authenticateToken, async(req, res) => {
    try {
        let ancmnts = await Announcement.findAll({})
        res.send(ancmnts);
    } catch (error) {
       res.send(error.message) 
    }
})

router.delete('/delete/:id', authenticateToken, async(req, res) => {
    try {
      const ancmnt = await Announcement.findByPk(req.params.id);
      let fileKey = ancmnt.fileUrl;
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };
  
      await s3.deleteObject(deleteParams).promise();

        const result = await Announcement.destroy({
            where: { id: req.params.id },
            force: true,
        });

        if (result === 0) {
            return res.status(404).json({
              status: "fail",
              message: "Role with that ID not found",
            });
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
      res.status(500).send({ message: error.message });
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

    res.status(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).send({ message: error.message });
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
      console.error('Error deleting file from S3:', error);
      res.status(500).send({ message: error.message });
    }
});
module.exports = router;