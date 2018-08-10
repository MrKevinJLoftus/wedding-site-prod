const mongoose = require('mongoose');

const rsvpSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  comments: { type: String, required: false },
  isComing: { type: Boolean, required: true }
});

module.exports = mongoose.model('RSVP', rsvpSchema);
