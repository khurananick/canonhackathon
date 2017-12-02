module.exports = function(router) {
  router.post('/twilio/voice', function(req,res) {
    var twilio = require("twilio");
    var twiml = new twilio.TwimlResponse();
    twiml.dial(req.body.phone_number, { callerId: "+19083793854" });
    res.type('text/xml');
    res.send(twiml.toString());
  });

  router.post('/twilio/message', function(req,res) {
    res.send({ success: true });
  });
};
