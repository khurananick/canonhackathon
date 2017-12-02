var TWILIO_ACCOUNT_SID = "AC273b0bbbb35b08b2045d3c70b1af2212";
var TWILIO_AUTH_TOKEN = "9d4492a9c2b831c47913576f7b5d78d0";
var TWILIO_API_KEY = "SKd0173a204516d314ab7627cdd95e7064";
var TWILIO_API_SECRET = "fr9bQYEQJC8xNThWyUQwgzfsZYEMazFU";

module.exports = {
  sendSms: function(to, message, callback) {
    var client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    client.messages.create({
      to: to,
      from: "+16466933617",
      body: message
    }, function(err, message) {
      console.log(err);
      callback();
    });
  },
  sendMail: function(to, subject, body, callback) {
    var sendmail = require('sendmail')();
    sendmail({
        from: 'support@appkat.com',
        to: to,
        subject: subject,
        html: body,
      }, function(err, reply) {
        callback();
    });
  },
  addTwilioToLocals: function(res, callback) {
    var twilio = require('twilio');
    var AccessToken = require('twilio').AccessToken;
    var ConversationsGrant = AccessToken.ConversationsGrant;

    var vtoken = new AccessToken(
        TWILIO_ACCOUNT_SID,
        TWILIO_API_KEY,
        TWILIO_API_SECRET
    );
    vtoken.identity = res.locals.twilioconnid;

    //grant the access token Twilio Video capabilities
    var grant = new ConversationsGrant();
    grant.configurationProfileSid = "VS7892ca8624636d2f1899a012c2414b26";
    vtoken.addGrant(grant);

    // grant the access token Twilio Phone capabilities
    var capability = new twilio.Capability(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    capability.allowClientIncoming(res.locals.twilioconnid);
    capability.allowClientOutgoing("AP7d5f93d2c0d0f68f068fe43ef1ac31c5");

    res.locals.twiliovideotoken = vtoken.toJwt();
    res.locals.twilioaudiotoken = capability.generate();
    callback(res);
  }
};
