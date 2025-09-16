import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import Team from '../models/team.model.js';

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

export const list = async (req, res) => {
    try {
        const members = await Team.find();
        res.json({ success: true, members });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const create = async (req, res) => {
    try {
        let imageUrl = '';
        if (req.file && req.file.location) {
            imageUrl = req.file.location;
        }
        const member = new Team({
            ...req.body,
            image: imageUrl
        });
        await member.save();
        res.json({ success: true, member });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const get = async (req, res) => {
    try {
        const member = await Team.findById(req.params.id);
        if (!member) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, member });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const update = async (req, res) => {
    try {
        let updateData = { ...req.body };
        if (req.file && req.file.location) {
            updateData.image = req.file.location;
        }
        const member = await Team.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!member) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, member });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

export const deleteMember = async (req, res) => {
    try {
        const member = await Team.findByIdAndDelete(req.params.id);
        if (!member) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const datatable = async (req, res) => {
    try {
        const members = await Team.find();
        res.json({ data: members });
    } catch (err) {
        res.status(500).json({ data: [], error: err.message });
    }
};
