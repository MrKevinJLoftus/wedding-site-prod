const mongoose = require('mongoose');

const guestSchema = mongoose.Schema({
  userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
  firstName: {type: String},
  lastName: {type: String},
  isPlusOne: {type: Boolean},
  isAttending: {type: Boolean},
  hasRSVPd: {type:Boolean}
});

module.exports = mongoose.model('Guest', guestSchema);
