import NewsletterSubscriber from '../models/newsletter.model.js';

export const list = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 });
    res.json({ success: true, data: subscribers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
