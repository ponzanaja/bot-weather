var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.set('port', (process.env.PORT || 4000))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/webhook', function(req, res) {
  var key = 'EAAD1c1pnFCABAP1AZBITVWSpseC06wyIVpX6lKegAJ3UIk4uoBNHXI0ICVDUTmI6e2Ht8Hv3VFzMIAF32AR3kffF7VgsZBXRMzuRnplCRBpZCAauZCTyCsGUvWfrSfSkpJ7OxbgtT6EYglG7ZA8OtyBUuZCxGZB0jEgdBWlf7WYlAZDZD'
  if (req.query['hub.verify_token'] === key) {
    res.send(req.query['hub.challenge'])
  }
  res.send('Error, wrong token')
})

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;
  messageText = messageText.toLowerCase();
  if (messageText) {
    if (messageText === 'help') {
      sendTextMessage(senderID, "You can try name of city like 'London , Bangkok, Newyork'");
    }else{
      //sendTextMessage(senderID, "diedieideokdeokd");
      sendTextMessage(senderID, callAPI(senderID,messageText));
    }

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.


  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}
function sendGenericMessage(recipientId, messageText) {
  // To be expanded in later sections
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAAD1c1pnFCABAP1AZBITVWSpseC06wyIVpX6lKegAJ3UIk4uoBNHXI0ICVDUTmI6e2Ht8Hv3VFzMIAF32AR3kffF7VgsZBXRMzuRnplCRBpZCAauZCTyCsGUvWfrSfSkpJ7OxbgtT6EYglG7ZA8OtyBUuZCxGZB0jEgdBWlf7WYlAZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}

function callAPI(senderID,city){
  var weatherEndpoint = 'http://api.openweathermap.org/data/2.5/weather?q=' +city+ '&units=metric&APPID=002e6cfd23a240ad310aa6837efa338c'
     request({
       url: weatherEndpoint,
       json: true
     }, function(error, response, body) {
       try {
         var data = body.main;

         setTimeout(function(){ sendTextMessage(senderID, city +"Now have temparature at "+ data.temp + "c "); }, 1000);
         setTimeout(function(){ sendTextMessage(senderID,  city +"Now have maximum temparature at"+ data.temp_max + "c "); }, 2000);
         setTimeout(function(){ sendTextMessage(senderID,  city +"Now have minimum temparature at"+ data.temp_min + "c "); }, 3000);
       } catch(err) {
         console.error('error caught', err);
         sendTextMessage(senderID, "There was an error.");
       }
     })
}

app.listen(app.get('port'), function () {
  console.log('run at port', app.get('port'))
})
