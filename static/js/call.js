var debug;
var tryingTwilioAudio;
var twilioAudioConn;
var path = document.location.pathname;

(function() {
  let audioConnect;
  var audioConnectAttempts = 0;
  var connectToAudioChannel = function() {
    Twilio.Device.setup(twilioaudiotoken);
    Twilio.Device.connect(function(conn) {
      twilioAudioConn = conn;
    });
    Twilio.Device.error(function(error) {
      if(audioConnectAttempts < 5) {
        audioConnectAttempts++;
        setTimeout(function() {
          connectToAudioChannel();
        }, 1000);
      }
      if(debug) console.log(error.message);
    });
    Twilio.Device.ready(function(device) {
      tryingTwilioAudio = true;
      audioConnect = Twilio.Device.connect({
         agent: twiliosessionid,
         phone_number: "+19205455120"
       });

      setTimeout(function() {
        var client = new BinaryClient('ws://localhost:9001');
        client.on('open', function() {
          window.Stream = client.createStream();
        });

        var context = new window.AudioContext();
        var audioInput = context.createMediaStreamSource(audioConnect.mediaStream.stream);

        var bufferSize = 2048;
          // create a javascript node
        var recorder = context.createScriptProcessor(bufferSize, 1, 1);
        // specify the processing function
        recorder.onaudioprocess = recorderProcess;
        // connect stream to our recorder
        audioInput.connect(recorder);
        // connect our recorder to the previous destination
        recorder.connect(context.destination);

        function convertFloat32ToInt16(buffer) {
          l = buffer.length;
          buf = new Int16Array(l);
          while (l--) {
            buf[l] = Math.min(1, buffer[l])*0x7FFF;
          }
          return buf.buffer;
        }

        function recorderProcess(e) {
          console.log(e);
          var left = e.inputBuffer.getChannelData(0);
          window.Stream.write(convertFloat32ToInt16(left));
        }
      },2500);

    });

    setTimeout(function() {
      if(Twilio.Device.status() == "ready" && !tryingTwilioAudio) {
        // [window.userName] is unique
        audioConnect = Twilio.Device.connect({
           agent: twiliosessionid,
           phone_number: "+19205455120"
         });
        console.log("audio", audioConnect);
      }
    },1000);
  }; connectToAudioChannel();

  var listenForCallinOptionSwitch = (function () {
    $(".callin").on("change", function(e) {
      if(e.target.value == "phone") {
        twilioAudioConn.disconnect();
        tryingTwilioAudio = false;
        $(".dialinoption").removeClass("hidden");
      } else {
        connectToAudioChannel();
        $(".dialinoption").addClass("hidden");
      }
    });
  })();
})();

