import Slider from '../models/slider.model.js';

export const list = async (req, res) => {
  try {
    const sliders = await Slider.find();
    res.json({ success: true, sliders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const datatable = async (req, res) => {
  try {
    const sliders = await Slider.find();
    res.json({ data: sliders });
  } catch (err) {
    res.status(500).json({ data: [], error: err.message });
  }
};

export const get = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, slider });
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
    if (!imageUrl && !req.body.image) {
      return res.status(400).json({ success: false, error: 'Image is required', debug: { file: req.file, body: req.body } });
    }
    const slider = new Slider({
      ...req.body,
      image: imageUrl || req.body.image
    });
    await slider.save();
    res.json({ success: true, slider });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, debug: { file: req.file, body: req.body, stack: err.stack } });
  }
};

export const update = async (req, res) => {
  try {
    let updateData = { ...req.body };
    if (req.file && req.file.location) {
      updateData.image = req.file.location;
    }
    const slider = await Slider.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!slider) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, slider });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, debug: { file: req.file, body: req.body, stack: err.stack } });
  }
};

export const deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findByIdAndDelete(req.params.id);
    if (!slider) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
