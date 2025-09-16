import express from 'express';
import { list, create, get, update, deleteMember, datatable } from '../controllers/team.controller.js';
import multer from 'multer';
import multerS3 from 'multer-s3';
import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();
const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            cb(null, `team/${Date.now()}_${file.originalname}`);
        }
    })
});

const router = express.Router();

router.get('/list', list);
router.get('/datatable', datatable);
router.post('/add', upload.single('image'), create);
router.get('/:id', get);
router.put('/:id', upload.single('image'), update);
router.delete('/:id', deleteMember);
router.get('/', list);

export default router;
