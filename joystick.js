// Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis 

// [IAD] REF: /home/iqdean/u1404/intel-edison/8-5-node-xbox-gamepad.txt
//            for xbox360 Game Controller button/joystick mappings

// Current Usage 

// Saftey Button - DPAD Up Button - HOLD PUSHED TO DRIVE
// { time: 16346348, value: 0, number: 13, type: 'button', id: 1 }
//                    |
//                    |   safety    throttle
//                    0 - enabled   disabled ( kills throttle control if u release the safety button)
//                    1 - disabled  enabled  ( push and hold pushed to enable the throttle)

// Throttle - Right JoyStick
  
//                 +1 Full Fwd
// 
//   Full Lft -1    +   +1 Full Rt 
//
//                 -1 Full Rev


function intToFloat(num, decPlaces) { return num.toFixed(decPlaces); }

var joystick = new (require('joystick'))(1, 3500, 350);

// following 3 variables get updated by joystick event handlers (aka callbacks)
var safety = 'disabled';  
var CV = 0;               // these 2 vars get sampled and published to ros as /cmd_vel message 
var CAV = 0;              // on a periodic basis... lets use 10hz for now

joystick.on('button', function(event) {

// { time: 17062012, value: 1, number: 13, type: 'button', id: 1 }
// { time: 17062812, value: 0, number: 13, type: 'button', id: 1 }

    if (event.number === 13 && event.value === 1) {
	safety = 'disabled';
	console.log('safety : ', safety);
    }

    if (event.number === 13 && event.value === 0) {

	safety = 'enabled';
	CV = 0;  // Saftey enabled kill the throttle in case
	CAV = 0; // it got released while the joystick wasn't near center
	
	// pubCMDvel() here

	console.log('safety cv cav ', safety, CV, CAV);
    }

});

joystick.on('axis', function(event) {

    //console.log(event);

    // Scale Right Joystick X axis to a -1 < float_ry < +1 

    //                         value  number     type
    //{ time: 9078256, value:   xxx , number: 3, type: 'axis', id: 1 }
    //                           |
    //                -32767     0     +32767
    //                 -1.00            +1.00
    //               Full Left         Full Right

    if (safety === 'disabled' ) {

	if (event.type === 'axis' && event.number === 3) {
	    CAV = intToFloat(event.value/32768, 2);
	    console.log('CAV ', CAV);
	}

	// Scale Right Joystick Y axis to a -1 < float_ry < +1 

	//                        -32767  +1 Full Fwd
	//                           |
	//                         value  number     type
	//{ time: 9078256, value:   yyy , number: 3, type: 'axis', id: 1 }
	//                           |
	//                        +32767  -1 Full Rev

	if (event.type === 'axis' && event.number === 4) {
	    CV = intToFloat(event.value/-32768, 2);
	    console.log(' CV ', CV);
	}
    }

});



