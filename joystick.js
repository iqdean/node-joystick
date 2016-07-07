// Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis 
var joystick = new (require('joystick'))(1, 3500, 350);
joystick.on('button', console.log);
joystick.on('axis', console.log);

