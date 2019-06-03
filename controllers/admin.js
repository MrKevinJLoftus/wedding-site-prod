const async = require('async');
const RSVP = require('../models/rsvp');
const User = require('../models/user');
const Guest = require('../models/guest');
const stdError = new Error('An error has occurred.');
const mongoose = require('mongoose');

exports.runRsvpReport = (req, res, next) => {
    // grab all users and all guests
    // place into objects with userId, guests array
    // result object will have reportData (userIds + guests arrays), totalGuestsComing, numberOfGuestsWhoHaveRsvpdAndAreNotComing, totalGuestsNotComing, numberOfGuestsRsvpd
    console.log('calling run rsvpReport');
    async.waterfall([async.apply(getAllUsers, req), getAllGuests, getAllRsvps], 
    (err, results) => {
        if (err) {
            next(stdError);
        } else {
            const allGs = results.allGuests;
            const allUs = results.allUsers;
            const allRs = results.allRsvps;
            const reportResultsObj = {
                reportData: [],
                totalGuestsComing: allGs.filter(g => g.isAttending).length,
                numberOfGuestsWhoHaveRsvpdAndAreNotComing: allGs.filter(g => g.hasRSVPd && !g.isAttending).length,
                numberOfGuestsRsvpd: allGs.filter(g => g.hasRSVPd).length,
                totalNumberOfGuests: allGs.length
            };
            for (let i = 0; i < allUs.length; i++) {
                const currentUser = allUs[i];
                const currentRow = {};
                currentRow.userName = currentUser.username;
                currentRow.guestsAttending = allGs.filter(g => currentUser._id.equals(g.userId) && g.isAttending);                
                currentRow.guestsNotAttending = allGs.filter(g => currentUser._id.equals(g.userId) && !g.isAttending);
                currentRow.rsvps = allRs.filter(r => currentUser._id.equals(r.userId));
                reportResultsObj.reportData.push(currentRow);
            }
            res.status(200).json({
                results: reportResultsObj
            });
        }
    });
}

function getAllUsers(req, callback) {
    console.log('calling getAllUsers');
    User.find({}, (err, users) => {
        if (err) {
            callback(err);
        } else {
            req.allUsers = users;
            callback(null, req);
        }
    });
}

function getAllGuests(req, callback) {
    console.log('calling getAllGuests');
    Guest.find({}, (err, guests) => {
        if (err) {
            callback(err);
        } else {
            req.allGuests = guests;
            callback(null, req);
        }
    });
}

function getAllRsvps(req, callback) {
    console.log('calling getAllRsvps');
    RSVP.find({}, (err, rsvps) => {
        if (err) {
            callback(err);
        } else {
            req.allRsvps = rsvps;
            callback(null, req);
        }
    });
}
