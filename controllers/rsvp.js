const RSVP = require('../models/rsvp');
const Guest = require('../models/guest');
const User = require('../models/user');
const UserController = require('../controllers/user');
const GuestController = require('../controllers/guest');
const async = require('async');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const stdError = new Error('An error has occurred.');
const unkError = new Error('An unknown error has occurred.');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

exports.guestResponseToRSVP = async (req, res, next) => {
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
  async.waterfall([async.apply(saveUserEmail, req), updateGuests, saveRSVPDetails], async (err, result) => {
    if (err) {
      next(err);
    } else {
      await sendRSVPEmail(req, (result) => {
        res.status(200).json({
          message: 'RSVP saved successfully!',
          rsvpSaved: true
        });
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
    try {
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
    } catch (err) {
      console.log('updateGuests in controllers/rsvp.js failed.');
      console.log(err);
      callback(stdError);
    }
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

async function sendRSVPEmail(params, callback) {
  try {
    const oauth2Client = new OAuth2(
      process.env.EMAIL_API_CLIENT_ID,
      process.env.EMAIL_API_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({
      refresh_token: process.env.EMAIL_API_REFRESH_TOKEN
    });
    const tokens = await oauth2Client.refreshAccessToken();
    const accessToken = tokens.credentials.access_token;
    let attendingLis = '';
    let firstAttending = true;
    let notAttendingLis = '';
    let firstNotAttending = true;
    let isAnyoneComing = false;
    params.body.guests.forEach((guest) => {
      if (guest.isAttending) {
        isAnyoneComing = true;
        if (firstAttending) {
          attendingLis = `<div><u>Attending</u></div><ul>`;
          firstAttending = false;
        }
        attendingLis += `<li>${guest.firstName} ${guest.lastName}</li>`;
      } else {
        if (firstNotAttending) {
          notAttendingLis = `<div><u>Not Attending</u></div><ul>`;
          firstNotAttending = false;
        }
        if (guest.isPlusOne) {
          guest.firstName = 'Your';
          guest.lastName = 'Plus One';
        }
        notAttendingLis += `<li>${guest.firstName} ${guest.lastName}</li>`;
      }
    });
    if (attendingLis) attendingLis += "</ul><br/>";
    if (notAttendingLis) notAttendingLis += "</ul><br/>";
    const userComments = params.body.comments;
    let emailComments = '';
    if (userComments && userComments.length > 0) {
      emailComments = `<div>Comments:</div><br/><p>${userComments}</p><br/>`;
    }
    const userEmail = params.body.email;
    const isAnyoneComingText = (isAnyoneComing) ? 
      `We look forward to seeing you on August 17th, 2019 at the BWI Airport Marriott hotel.` :
      `We'll be missing you!`;
    const emailBody = `
      <h1>Thank you for RSVPing to our wedding!</h1>
      <h3>${isAnyoneComingText}</h3>
      <p>Here are the details you provided:</p>
      <br />
      ${attendingLis}
      ${notAttendingLis}
      ${emailComments}
      <p>If your plans change, please edit your RSVP by logging into https://patelwedsloft.us/rsvp and updating your selections.</p>
      <br />
      <p>If you have any questions, feel free to reply to this email and we will get back to you as soon as possible.</p>
      `;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'loftuspatelwedding@gmail.com',
        clientId: process.env.EMAIL_API_CLIENT_ID,
        clientSecret: process.env.EMAIL_API_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_API_REFRESH_TOKEN,
        accessToken: accessToken
      }
    });
    const mailOptions = {
      from: 'loftuspatelwedding@gmail.com',
      to: userEmail,
      bcc: 'loftuspatelwedding@gmail.com',
      subject: 'Thanks for RSVPing to the Patel/Loftus Wedding!',
      generateTextFromHTML: true,
      html: emailBody
    };
    let info = await transporter.sendMail(mailOptions);
    callback(null, params);
  } catch (err) {
    console.log('sendRSVPEmail failed!');
    console.log(err);
    callback(stdError);
  }
}

exports.findExistingRsvp = (req, res, next) => {
  // find the RSVP
  // retrieve the guests
  // tack on user email
  console.log('calling findExistingRsvp');
  let detailedRsvp = {};
  RSVP.findOne({ userId: req.userData.userId }).sort({dateSubmitted: -1})
  .then((rsvp) => {
    detailedRsvp.rsvp = rsvp;
    return getGuests(req);
  })
  .then((guests) => {
    detailedRsvp.guests = guests;
    return UserController.getEmail(req.userData.userId);
  })
  .then((userEmail) => {
    detailedRsvp.email = userEmail;
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
