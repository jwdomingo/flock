var Venue = require('../models/venueModel');
var request = require('request-promise');
var Q = require('q');

var api = require('../../config');
var urlPrefix = 'https://api.foursquare.com/v2/venues/'
var urlSuffix = `?client_id=${api.foursquare.client_ID}&client_secret=${api.foursquare.client_secret}&v=20160225`

/* ---------------- */
/*     PROMISES     */
/* ---------------- */

var getVenues = Q.nbind(Venue.find, Venue);
var findVenue = Q.nbind(Venue.findOne, Venue);
var createVenue = Q.nbind(Venue.create, Venue);
var updateVenue = Q.nbind(Venue.findOneAndUpdate, Venue);
var removeVenue = Q.nbind(Venue.remove, Venue);

/* ------------------------ */
/*     VENUE CONTROLLER     */
/* ------------------------ */

module.exports = {
  /////////////////
  // FETCH VENUE //
  /////////////////
  fetchOne: (req, res) => {
    const venueId = req.query.venueId;

    findVenue({venueId: venueId})
    .then(venue => {
      if (venue) {
        res.status(200).json(venue);
      } else {
        request({
          uri: `${urlPrefix}${venueId}${urlSuffix}`,
          json: true
        })
        .then(fsq => {
          createVenue({
            venueId: venueId,
            photoSuffix: fsq.response.venue.bestPhoto.suffix,
            rating: fsq.response.venue.rating,
            price: !fsq.response.venue.price ? '' :
              fsq.response.venue.price.tier,
            tier: !fsq.response.venue.price ? '' :
              fsq.response.venue.price.message,
            hours: !fsq.response.venue.hours ? [] :
              fsq.response.venue.hours.timeframes.map(time => {
                return {days: time.days, open: time.open}
              }),
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .then(newVenue => {
            res.status(201).json(newVenue);
          })
          .fail(err => {
            console.error(`Could not create new venue: ${err}`);
            throw new Error(`Could not create new venue: ${err}`);
          });
        })
        .catch(err => {
          console.error(`Failed to get venue data from Foursquare: ${err}`);
          throw new Error(`Failed to get venue data from Foursquare: ${err}`);
        });
      }
    })
    .fail(err => {
      console.error(`Failed to get venue data from database: ${err}`);
      throw new Error(`Failed to get venue data from database: ${err}`);
    });
  },

  //////////////////
  // UPDATE VENUE //
  //////////////////
  updateOne: (req, res) => {
    const venueId = req.body.venueId;
    request({
      uri: `${urlPrefix}${venueId}${urlSuffix}`,
      json: true
    })
    .then(fsq => {
      const update = {
        updatedAt: new Date(),
        photoSuffix: fsq.response.venue.bestPhoto.suffix,
        rating: fsq.response.venue.rating,
        price: !fsq.response.venue.price ? [] :
          fsq.response.venue.price.tier,
        tier: !fsq.response.venue.price ? [] :
          fsq.response.venue.price.message,
        hours: !fsq.response.venue.hours ? [] :
          fsq.response.venue.hours.timeframes.map(time => {
            return {days: time.days, open: time.open}
          })
      };

      updateVenue({venueId: venueId}, update, {new: true})
      .then(updatedVenue => {
        res.status(201).json(updatedVenue);
      })
      .fail(err => {
        console.error(`Could not update new venue: ${err}`);
        throw new Error(`Could not update new venue: ${err}`);
      });
    })
    .catch(err => {
      console.error(`Failed to get venue data from Foursquare: ${err}`);
      throw new Error(`Failed to get venue data from Foursquare: ${err}`);
    });
  },

  //////////////////
  // REMOVE VENUE //
  //////////////////
  removeOne: (req, res) => {
    removeVenue({venueId: req.body.venueId})
    .then(function (status) {
      res.status(200).json(status);
    })
    .fail(function (err) {
      console.error('Could not delete venue');
      throw new Error('Could not delete venue');
    });
  }
};
