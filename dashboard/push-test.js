#!/usr/bin/env node
var WebSocketClient = require('websocket').client;
 
var client = new WebSocketClient();
 
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            var msg = JSON.parse(message.utf8Data);
            if (msg.custom) return;
            console.log("Received: '" + message.utf8Data + "'");
        }
    });
    
    function sendInit() {
        var initMsg = {"method":"init","data":{"num:shiny.number":1,".clientdata_output_test_width":1340,".clientdata_output_test_height":400,".clientdata_output_test_hidden":false,".clientdata_pixelratio":2,".clientdata_url_protocol":"http:",".clientdata_url_hostname":"localhost",".clientdata_url_port":"3279",".clientdata_url_pathname":"/",".clientdata_url_search":"",".clientdata_url_hash_initial":"",".clientdata_singletons":"",".clientdata_allowDataUriScheme":true}};
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            connection.send(JSON.stringify(initMsg));
        }
    }

    function sendUpdate() {
        var n = Math.round(Math.random()*128);
        console.log('sending update...', n);
        var updateMsg = {"method":"update","data":{"dataPoint:shiny.number":n,"metric":"metricName"+n}};
        connection.send(JSON.stringify(updateMsg));
    }
    sendInit();
    setInterval(sendUpdate, 150);
});
 
client.connect('ws://localhost:5901/websocket');
