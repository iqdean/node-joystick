// with steamos xpad driver installed
// hp dm4  xbox360 shows up on id 1 (/dev/input/js1)
// ac720   xbox360 shows up on id 0 (/dev/input/js0)
//                                       id -deadzone-
var joystick = new (require('joystick'))(1, 3500, 350);
joystick.on('button', console.log);
joystick.on('axis', console.log);

