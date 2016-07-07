// Set a deadzone of +/-3500 (out of +/-32k) and a sensitivty of 350 to reduce signal noise in joystick axis 

// [IAD] REF: /home/iqdean/u1404/intel-edison/8-5-node-xbox-gamepad.txt
//            for xbox360 Game Controller button/joystick mappings to 
//            event emitter messages

/*
iqdean@hpdm4:~/u1404/nodeprojs/4-2-node-joystick$ node joystick.js
{ time: 7907996,                 \
  value: 0,
  number: 0,        button 0
  init: true,
  type: 'button',
  id: 1 }
...                 button 1-13   > 1 For ea of the 15 buttons, you get a init msg
{ time: 7908028,                      when you 1st connect to the joystick
  value: 0,
  number: 14,       button 14
  init: true,
  type: 'button',
  id: 1 }                       /

{ time: 7908028,
  value: 0,
  number: 0,        axis 0     \
  init: true,
  type: 'axis',
  id: 1 }
...                 axis 1-4    > 2 For ea of the 6 axis, you get a init msg
{ time: 7908032,                    with it's inital state when u 1st connect
  value: -32767,
  number: 5,        axis 5     /
  init: true,
  type: 'axis',
  id: 1 }
                                  3 subsequently, you get event for each event
                                    as user moves joysticks and/or pushes buttons

{ time: 7910400, value: 1, number: 0, type: 'button', id: 1 }
{ time: 7910560, value: 0, number: 0, type: 'button', id: 1 }
{ time: 7911224, value: 1, number: 0, type: 'button', id: 1 }

*/

var joystick = new (require('joystick'))(1, 3500, 350);
joystick.on('button', console.log);

joystick.on('axis', function(event) {
    console.log(event);
});

