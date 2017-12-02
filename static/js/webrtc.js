(function() {
  var debug = true;
  var get = (function() {
    var query = window.location.search.substring(1);
    var raw_vars = query.split("&");
    var params = {};
    for(var key in raw_vars) {
      param = raw_vars[key].split("=");
      variable = param[0];
      value = param[1];
      if(variable) {
        params[variable] = decodeURIComponent(value);
      }
    }
    return params;
  })();

  var screen = $("#screen");
  screen.hide();
  var roomName = window.session_name;
  var userName = window.userName;
  var hostID;
  var participantID;
  var observerID;
  var myEasyrtcId;
  var uniquePeers;
  var hasPeers;

  var sendingGesture;
  var sendingScreenshot;
  var sendingScreenshotAckTimer;
  var currentScreenshot = "";
  var previousAndroidScreenshot = "";

  var sendScreenshotToHost = function(screenshot) {
    if(screenshot.match(/jpeg/)) {
      if(screenshot != previousAndroidScreenshot) {
        sendingScreenshot = true;
        previousAndroidScreenshot = screenshot;
        sendHostMessage("screenshare",screenshot);
        clearTimeout(sendingScreenshotAckTimer);
        sendingScreenshotAckTimer = setTimeout(function() {
          sendingScreenshot = false;
        }, 1500);
      }
    }
  };

  var startScreenshotInverval = function(device) {
    setInterval(function() {
      if(!sendingScreenshot) {
        var screenshot = (function() {
          if(device.android) return AndroidWebInterface.getScreenshot();
        })();
        sendScreenshotToHost(screenshot);
      }
      var sendTouchEvents = (function() {
        if(device.android) {
          var gestureList = JSON.parse(AndroidWebInterface.getTouchEvents());
          for(var key in gestureList) {
            if(!sendingGesture) {
              sendHostMessage("clientgesture", gestureList[key]);
              delete gestureList[key];
            }
          }
        }
      })();
    },250);
  };

  var connectDataChannel = function() {
    var loginFailure = function(errorMessage) {
      setTimeout(function() {
        connectDataChannel();
      }, 1000);
      console.log("Error:: " + errorMessage);
    };
    var loginSuccess = function(easyrtcId) {
      console.log(easyrtcId);
      myEasyrtcId = easyrtcId;
      connectToVideoChannel();

      window.sendMessage = function(easyrtcId, msgType, message) {
        easyrtc.sendData(easyrtcId, msgType, message);
      };
      window.sendHostMessage = function(msgType, message) {
        sendMessage(hostID, msgType, message);
        return { success: true };
      };
      if(typeof AndroidWebInterface != "undefined") {
        startScreenshotInverval({ android: true });
      }
    };
    var newOccupantJoined = function(roomName, occupants, isPrimary) {
      for(var easyrtcId in occupants) {
        console.log(occupants);
        var username = easyrtc.idToName(easyrtcId);
        if(username.match(/researcher/) && hostID != easyrtcId) {
          hostID = easyrtcId;
        }
        if(username.match(/observer/) && observerID != easyrtcId) {
          observerID = easyrtcId;
        }
        if(username.match(/participant/) && participantID != easyrtcId) {
          participantID = easyrtcId;
        }
      }
    };
    var newMessageFromPeer = function(who, msgType, message) {
      if(msgType=="screenshotreceived") {
        sendingScreenshot = false;
      }
      console.log(who,msgType,message);
    };
    easyrtc.enableVideo(false);
    easyrtc.enableAudio(false);
    easyrtc.enableDataChannels(true);
    console.log(userName);
    easyrtc.setUsername(userName);
    easyrtc.setRoomOccupantListener(newOccupantJoined);
    easyrtc.setPeerListener(newMessageFromPeer);
    easyrtc.connect(roomName, loginSuccess, loginFailure);
  }; connectDataChannel();

  var connectToVideoChannel = function() {
    window.conversationsClient=undefined;
    window.activeConversation=undefined;
    window.previewMedia=undefined;

    window.callParticipant = function() {
      var client = window.session_id+"participant";
      conversationsClient.inviteToConversation(client, {
        localStreamConstraints: { video: { width: 320, height: 180 }, audio: false }
      }).then(conversationStarted, function(err) {
        if(debug) console.log(err);
      });
    };

    var accessToken = window.twiliovideotoken;
    var accessManager = new Twilio.AccessManager(accessToken);
    conversationsClient = new Twilio.Conversations.Client(accessManager);

    conversationsClient.listen().then(
      clientConnected,
      function (error) {
        if(debug)
          console.log('Could not connect to Twilio: ' + error.message);
      }
    );

    function clientConnected() {
      if(debug)
        console.log("Connected to Twilio. Listening for incoming Invites as '" + conversationsClient.identity + "'");

      if(easyrtc.username.match(/participant/))
        easyrtc.sendData(hostID,"participantVideoReady",true);

      conversationsClient.on('invite', function (invite) {
        if(debug)
          console.log('Incoming invite from: ' + invite.from);
        invite.accept({
          localStreamConstraints: { video: { width: 320, height: 180 }, audio: false }
        }).then(conversationStarted);
      });
    }

    function conversationStarted(conversation) {
      if(debug)
        console.log('In an active Conversation');

      activeConversation = conversation;

      conversation.on('participantConnected', function (participant) {
        if(debug)
          console.log("Participant '" + participant.identity + "' connected");

        participant.media.attach('#remote-media');
        screen.show();
        if (!previewMedia) {
          conversation.localMedia.attach('#local-media');
        }
      });

      conversation.on('participantDisconnected', function (participant) {
        if(debug)
          console.log("Participant '" + participant.identity + "' disconnected");
      });

      conversation.on('ended', function (conversation) {
        if(debug)
          console.log("Connected to Twilio. Listening for incoming Invites as '" + conversationsClient.identity + "'");
        conversation.localMedia.stop();
        conversation.disconnect();
        activeConversation = null;
      });
    }
  };

  $("#call_participant").on("click",function() {
    window.callParticipant();
  });
})();
