const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Announcement = require('../model/announcement');

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

// router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
//     try {
//       if (!req.file) {
//         return res.send({ message: 'No file uploaded' });
//       }
      
//       const customFileName = req.body.name || req.file.originalname;  
//       const sanitizedFileName = customFileName.replace(/[^a-zA-Z0-9]/g, '_');
  
//       const params = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: `Users/documents/${Date.now()}_${sanitizedFileName}`,
//         Body: req.file.buffer,
//         ContentType: req.file.mimetype,
//         ACL: 'public-read'
//       };
  
//       const data = await s3.upload(params).promise();
  
//       const fileUrl = data.Location ? data.Location : '';
//       const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
  
//       res.send({
//         message: 'File uploaded successfully',
//         file: req.file,
//         fileUrl: key
//       });
//     } catch (error) {
//       res.status(500).send({ message: error.message });
//     }
//   });

module.exports = router;