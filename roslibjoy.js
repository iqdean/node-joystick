// Big Picture

// xbox360 Game Controller
//    |
//   usb
//    |
// u1404 notebook  <---usb eth cable---> Robot ECU1 (Edison)
//
//    xbox inputs
//       |
//    npm* joystick                            roscore
//       |
//  roslibjoy.js  reads joystick
//       |        & publishes
//     /cmd_vel     /cmd_vel
//       |
//    npm* roslib  ---- websocket ----->  rosbridge-server
//                                                |
//                                             /cmd_vel
//                                                |
//                                        robot_base_controller
//
//  *npm - designates a node package

// REFS:
// joystick.js = Node.js module for reading joystick data under Linux
// [1] https://github.com/nodebits/linux-joystick
// [2] https://github.com/JayBeavers/node-joystick
// [3] https://www.npmjs.com/package/joystick

// xbox360 Game Controller button/joystick mappings using joystick.js
// [4] /home/iqdean/u1404/intel-edison/8-5-node-xbox-gamepad.txt


// [1] joystick.js
//   $ npm install joystick
//     Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis

// [4] Wireless xbox360 GC Mappings
//
// Current Usage
//
// Saftey Button - LB Button 4 - HOLD PUSHED TO DRIVE
// { time: 27388336, value: 1, number: 4, type: 'button', id: 1 }  LB (Left Brake)
// { time: 27388480, value: 0, number: 4, type: 'button', id: 1 }
//                    |
//                    |   safety    throttle
//                    0 - enabled   disabled ( kills throttle control if u release the safety button)
//                    1 - disabled  enabled  ( push and hold pushed to enable the throttle)
//
// Throttle - Right JoyStick
//
//                 +1 Full Fwd  -32767
//                                                       up
//                                   left       right     |
//   Full Lft -1    +   +1 Full Rt   <-- axis 3 -->     axis 4
//   -32767                +32767                         |
//                                                       down
//                 -1 Full Rev  +32767

// 3 [IAD] roslibjoy.js = 3-node-roslib-example/node-simple.js + 4-2-node-joystick/joystick.js
//   Add roslib to joystick.js to publish /cmd_vel thru roslib to robot running rosbridge-server
//
//   $ npm install roslib
//     NOTE: For prereqs needed to get this working see intel-edison/8-5-node-xbox-gamepad.txt

// Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis
// id = 1 means use /dev/input/js1      id  -deadzone- 
// var joystick = new (require('joystick'))(1, 3500, 350);  << on hpdm4 joystick shows up as js1
var joystick = new (require('joystick'))(0, 3500, 350);
var ROSLIB = require('roslib');

// following 3 variables get updated by joystick event handlers (aka callbacks)
var safety = 'disabled';
// these 2 vars get sampled and published to ros as /cmd_vel msg at 10hz
var CV = parseFloat(0);    // CV = Commanded Linear Vel about X (+fwd) axis of robot in m/s
var CAV = parseFloat(0);   // CAV= Commanded Angular Vel about Z (+ lft - rt turn) in rad/s

// joystick fullscale inputs (-32767 0 +32767) are normalized/scaled to (-1 0 +1)
// based on your robots geometry (wheel dia, track width, wheel encoder resolution)
// (-1 0 +1) CV & CAV may produce unsafe (ex too fast) or too slow motion in response to
// joystick inputs. So, the following 2 parameters are used to scale the normalized 
// joystick inputs to produce desired linear and angular velocity ranges

var CV_SF = 0.75;  // fullscale joystick inputs result in  +/- 0.75 m/s   linear velocity
var CAV_SF= 1.5;   // fullscale joystick inputs result in  +/- 1.5  rad/s angular velocity 


var ros = new ROSLIB.Ros({
    //url : 'ws://localhost:9090'
    url : 'ws://192.168.2.15:9090'   // websocket of rosbridge-server on robot via usb eth
    //url : 'ws://10.0.0.157:9090'       // websocket via wifi
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

setInterval(publishToROS, 50);  // 1000ms = 1hz (debug), 100ms = 10hz, 50ms = 20hz

joystick.on('button', function(event) {

    if (event.number === 4 && event.value === 1) {
	safety = 'disabled';
	console.log('safety : ', safety, ' throttle engaged');
    }

    if (event.number === 4 && event.value === 0) {

	safety = 'enabled';
	console.log('safety : ', safety, ' throttle disabled');
	CV = parseFloat(0);   // Saftey enabled kill the throttle in case
	CAV = parseFloat(0); // it got released while the joystick wasn't near center

    }

});

joystick.on('axis', function(event) {

    if (safety === 'disabled' ) {

	if (event.type === 'axis' && event.number === 3) {     // right hand rule about z
	    CAV = intToFloat(CAV_SF*(event.value/-32768), 2);  // +left -rt turn
	}

	if (event.type === 'axis' && event.number === 4) {
	    CV = intToFloat(CV_SF*(event.value/-32768), 2);
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
