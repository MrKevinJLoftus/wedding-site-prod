const mongoose = require('mongoose');

const rsvpSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comments: { type: String, required: false },
  dateSubmitted: { type: Date }
});

module.exports = mongoose.model('RSVP', rsvpSchema);
