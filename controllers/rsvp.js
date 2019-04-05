const RSVP = require('../models/rsvp');
const Guest = require('../models/guest');
const GuestController = require('../controllers/guest');
const User = require('../models/user');
const async = require('async');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const stdError = new Error('An error has occurred.');
const unkError = new Error('An unknown error has occurred.');

exports.guestResponseToRSVP = (req, res, next) => {
  // logic flow:
  // receiving a list of guests with attending/not attending
  // req.body.guests[0].firstName, req.body.guests[0].lastName, req.body.guests[0].isAttending
  // need to validate the data and make sure everyone is marked as either coming or not coming
  // also receiving comments, req.body.comments, to save into the RSVP record
  // also receiving an email address to use for a point of contact, req.body.email

  // (1) validate the data
  // (2) save the email address in the User schema
  // (3) save each guest's isComing value in the Guest schema
  // (4) save the RSVP comments with a timestamp in the RSVP schema
  // (5) send an email to hosts and guest with the data they submitted
  // (6) send something back to the front end to let it know rsvp was submitted
  async.waterfall([async.apply(saveUserEmail, req), updateGuests, saveRSVPDetails], (err, result) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({
        message: 'RSVP saved successfully!',
        rsvpSaved: true
      });
    }
  });
}

function saveUserEmail(params, callback) {
  if (!params.body.email) {
    callback(new Error('Email is empty.'));
  } else {
    User.update({ username: params.userData.username },
      { $set: { email: params.body.email } }, (err, raw) => {
      if (err) {
        callback(stdError);
      } else {
        console.log('User email successfully saved.');
        callback(null, params);
      }
    });
  }
}

function updateGuests(params, callback) {
  const guests = params.body.guests;
  if (!guests || guests.length < 1) {
    callback(stdError);
  } else {
    async.each(guests, (guest, cb) => {
      Guest.update({ _id: guest._id },
        {
          firstName: guest.firstName,
          lastName: guest.lastName,
          isAttending: guest.isAttending,
          hasRSVPd: true
        }, (error, raw) => {
          if (error) {
            cb(error);
          } else {
            cb();
          }
        });
    }, (err) => {
      if (err) {
        console.log('updateGuests in controllers/rsvp.js failed.');
        console.log(err);
        callback(stdError);
      } else {
        console.log('updateGuests succeeded!');
        callback(null, params);
      }
    });
  }
}

function saveRSVPDetails(params, callback) {
  const rsvpToSave = new RSVP({
    userId: mongoose.Types.ObjectId(params.userData.userId),
    comments: params.body.comments,
    dateSubmitted: Date.now()
});
rsvpToSave.save()
  .then(result => {
    params.savedRSVP = rsvpToSave;
    callback(null, params);
  })
  .catch(err => {
      console.log("Error! " + err.message);
      callback(stdError);
  });
}

function sendRSVPEmail(params, callback) {
  const userEmail = params.body.email;
  const emailBody = `
    <p>Thank you for RSVPing to our wedding!</p>
    `;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'patelwedsloftus@gmail.com',
      pass: process.env.GMAIL_PW
    }
  });
  const mailOptions = {
    from: 'patelwedsloftus@gmail.com',
    to: userEmail,
    subject: 'Thanks for RSVPing to the Patel/Loftus Wedding!',
    html: emailBody
  };
}

exports.findExistingRsvp = (req, res, next) => {
  // find the RSVP
  // retrieve the guests
  // tack on user email
  console.log('calling findExistingRsvp');
  let detailedRsvp = {};
  RSVP.findOne({ userId: req.userData.userId })
  .then((rsvp) => {
    detailedRsvp.rsvp = rsvp;
    return getGuests(req);
  })
  .then((guests) => {
    detailedRsvp.guests = guests;
    detailedRsvp.email = req.userData.email;
    res.status(200).json({
      detailedRsvp: detailedRsvp
    });
  })
  .catch((err) => {
    next(err);
  });
}

function getGuests(req) {
  return new Promise((resolve, reject) => {
    Guest.find({ userId: req.userData.userId })
    .then(results => {
      if (!results) {
        reject(stdError);
      } else {
        resolve(results);
      }
    })
    .catch((err) => {
      reject(err);
    });
  });
}
