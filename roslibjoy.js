// 1 joystick.js
//   $ npm install joystick
// Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis 

// 2 [IAD] 
// REF: /home/iqdean/u1404/intel-edison/8-5-node-xbox-gamepad.txt
//            for xbox360 Game Controller button/joystick mappings
//
// Current Usage 
//
// Saftey Button - DPAD Up Button - HOLD PUSHED TO DRIVE
// { time: 16346348, value: 0, number: 13, type: 'button', id: 1 }
//                    |
//                    |   safety    throttle
//                    0 - enabled   disabled ( kills throttle control if u release the safety button)
//                    1 - disabled  enabled  ( push and hold pushed to enable the throttle)
//
// Throttle - Right JoyStick
//  
//                 +1 Full Fwd
// 
//   Full Lft -1    +   +1 Full Rt 
//
//                 -1 Full Rev

// 3 [IAD] roslibjoy.js = 3-node-roslib-example/node-simple.js + 4-2-node-joystick/joystick.js
//   Add roslib to joystick.js to publish /cmd_vel thru roslib to robot running rosbridge-server
//
//   $ npm install roslib   
//     NOTE: For prereqs needed to get this working see intel-edison/8-5-node-xbox-gamepad.txt


var joystick = new (require('joystick'))(1, 3500, 350);
var ROSLIB = require('roslib');

// following 3 variables get updated by joystick event handlers (aka callbacks)
var safety = 'disabled';  
var CV = parseFloat(0);               // these 2 vars get sampled and published to ros as /cmd_vel message 
var CAV = parseFloat(0);              // on a periodic basis... lets use 10hz for now

var ros = new ROSLIB.Ros({
    //url : 'ws://localhost:9090'
    url : 'ws://192.168.2.15:9090'
});

var cmdVel = new ROSLIB.Topic({
  ros : ros,
  name : '/cmd_vel',
  messageType : 'geometry_msgs/Twist'
});

var twist = new ROSLIB.Message({
linear : {
  x : 0.0,    // linear vel along X axis in meters/sec
  y : 0.0,
  z : 0.0
},
angular : {
  x : 0.0,
  y : 0.0,
  z : 0.0     // angular vel about Z axis in radians/sec
}
});

function intToFloat(num, decPlaces) { return parseFloat(num.toFixed(decPlaces)); }

function publishToROS() {

    // CV and CAV have to be a float otherwise u get a ROS type error on the other end

    // [ERROR] [WallTime: 946686132.737454] [Client 3] [id: publish:/cmd_vel:16] publish: 
    //         geometry_msgs/Twist message requires a float64 for field linear.x, but got a <type 'unicode'>

    // SO, outside the ROSLIB.Message() function, use parseFloat(CV CAV) to set CV/CAV to a float value

    twist.linear.x = CV;
    twist.angular.z = CAV;

    //console.log("twist.linear.x  : ", twist.linear.x);
    //console.log("twist.angular.z : ", twist.angular.z);

    cmdVel.publish(twist);
}

setInterval(publishToROS, 100);  // 1000ms = 1hz (debug), 100ms = 10hz (actual)

joystick.on('button', function(event) {

    if (event.number === 13 && event.value === 1) {
	safety = 'disabled';
	console.log('safety : ', safety, ' throttle engaged');
    }

    if (event.number === 13 && event.value === 0) {

	safety = 'enabled';
	console.log('safety : ', safety, ' throttle disabled');
	CV = parseFloat(0);   // Saftey enabled kill the throttle in case
	CAV = parseFloat(0); // it got released while the joystick wasn't near center

    }

});

joystick.on('axis', function(event) {

    if (safety === 'disabled' ) {

	if (event.type === 'axis' && event.number === 3) {
	    CAV = intToFloat(event.value/32768, 2);
	}

	if (event.type === 'axis' && event.number === 4) {
	    CV = intToFloat(event.value/-32768, 2);
	    //console.log(' CV ', CV);
	}
    }

});

ros.on('connection', function() {
console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
console.log('Connection to websocket server closed.');
});

