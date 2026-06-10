GF.TouchControls = function(options){
    options = options || {};

    var input = options.input;
    var getAimLevel = options.getAimLevel || function(){
        return GF.Config.player.defaultAim;
    };
    var maxAimLevel = GF.Config.player.aimLevels.length - 1;
    var root = document.getElementById('touchControls');
    var lobbyControls = document.getElementById('touchLobbyControls');
    var playButton = document.getElementById('touchPlayButton');
    var editButton = document.getElementById('touchEditButton');
    var joystick = document.getElementById('touchJoystick');
    var joystickKnob = document.getElementById('touchJoystickKnob');
    var actionControls = document.getElementById('touchActionControls');
    var aimSlider = document.getElementById('touchAimSlider');
    var aimHandle = document.getElementById('touchAimHandle');
    var shootButton = document.getElementById('touchShootButton');
    var activeMoveKeys = {};
    var visible = false;
    var editing = false;

    function init(){
        if(!root || !input){
            return;
        }

        visible = shouldEnableTouchControls();

        if(!visible){
            root.hidden = true;
            if(lobbyControls){
                lobbyControls.hidden = true;
            }
            return;
        }

        root.classList.toggle('debug-touch', window.location.search.indexOf('touch=1') >= 0);
        root.hidden = false;
        bindJoystick();
        bindAimSlider();
        bindButton(shootButton, function(){
            input.press(' ');
        }, function(){
            input.release(' ');
        });
        bindTap(playButton, function(){
            input.ready();
        });
        bindTap(editButton, function(){
            input.press('e');
            input.release('e');
        });
    }

    function shouldEnableTouchControls(){
        if(window.location.search.indexOf('touch=1') >= 0){
            return true;
        }

        return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    }

    function bindJoystick(){
        if(!joystick){
            return;
        }

        joystick.addEventListener('pointerdown', function(evt){
            evt.preventDefault();
            joystick.setPointerCapture(evt.pointerId);
            updateJoystick(evt);
        });

        joystick.addEventListener('pointermove', function(evt){
            if(evt.buttons === 0){
                return;
            }

            evt.preventDefault();
            updateJoystick(evt);
        });

        joystick.addEventListener('pointerup', resetJoystick);
        joystick.addEventListener('pointercancel', resetJoystick);
        joystick.addEventListener('lostpointercapture', resetJoystick);
    }

    function updateJoystick(evt){
        var rect = joystick.getBoundingClientRect();
        var centerX = rect.left + (rect.width / 2);
        var centerY = rect.top + (rect.height / 2);
        var radius = rect.width / 2;
        var dx = evt.clientX - centerX;
        var dy = evt.clientY - centerY;
        var distance = Math.sqrt((dx * dx) + (dy * dy));
        var maxKnobDistance = radius * 0.52;
        var normalizedX = dx / radius;
        var normalizedY = dy / radius;
        var threshold = 0.22;
        var nextKeys = {};

        if(distance > maxKnobDistance){
            dx = dx / distance * maxKnobDistance;
            dy = dy / distance * maxKnobDistance;
        }

        if(joystickKnob){
            joystickKnob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        }

        if(normalizedX < -threshold){
            nextKeys.h = true;
        }

        if(normalizedX > threshold){
            nextKeys.l = true;
        }

        if(normalizedY < -threshold){
            nextKeys.k = true;
        }

        if(normalizedY > threshold){
            nextKeys.j = true;
        }

        applyMoveKeys(nextKeys);
    }

    function applyMoveKeys(nextKeys){
        ['h', 'j', 'k', 'l'].forEach(function(key){
            if(nextKeys[key] && !activeMoveKeys[key]){
                input.press(key);
            }

            if(!nextKeys[key] && activeMoveKeys[key]){
                input.release(key);
            }
        });

        activeMoveKeys = nextKeys;
    }

    function resetJoystick(){
        applyMoveKeys({});

        if(joystickKnob){
            joystickKnob.style.transform = 'translate(0, 0)';
        }
    }

    function bindAimSlider(){
        if(!aimSlider){
            return;
        }

        aimSlider.addEventListener('pointerdown', function(evt){
            evt.preventDefault();
            aimSlider.setPointerCapture(evt.pointerId);
            updateAim(evt);
        });

        aimSlider.addEventListener('pointermove', function(evt){
            if(evt.buttons === 0){
                return;
            }

            evt.preventDefault();
            updateAim(evt);
        });
    }

    function updateAim(evt){
        var rect = aimSlider.getBoundingClientRect();
        var progress = (evt.clientY - rect.top) / rect.height;
        var level = Math.round((1 - clamp(progress, 0, 1)) * maxAimLevel);

        setAimLevel(level);
    }

    function setAimLevel(level){
        var currentLevel = getAimLevel();
        var key;

        level = Math.max(0, Math.min(maxAimLevel, level));

        while(currentLevel !== level){
            key = level > currentLevel ? 'a' : 'z';
            input.press(key);
            input.release(key);
            currentLevel += level > currentLevel ? 1 : -1;
        }

        updateAimHandle(level);
    }

    function updateAimHandle(level){
        var progress;

        if(!aimHandle){
            return;
        }

        progress = maxAimLevel ? 1 - (level / maxAimLevel) : 0;
        aimHandle.style.top = (progress * 100) + '%';
    }

    function bindButton(button, onDown, onUp){
        if(!button){
            return;
        }

        button.addEventListener('pointerdown', function(evt){
            evt.preventDefault();
            button.setPointerCapture(evt.pointerId);
            onDown();
        });

        button.addEventListener('pointerup', function(evt){
            evt.preventDefault();
            onUp();
        });

        button.addEventListener('pointercancel', onUp);
        button.addEventListener('lostpointercapture', onUp);
    }

    function bindTap(button, onTap){
        if(!button){
            return;
        }

        button.addEventListener('pointerdown', function(evt){
            evt.preventDefault();
            onTap();
        });
    }

    function update(state){
        var showGameplayControls;

        state = state || {};

        if(!root || !visible){
            return;
        }

        editing = state.editing;
        showGameplayControls = state.gameplay || state.playing || editing;
        root.classList.toggle('is-waiting', state.waiting);
        root.classList.toggle('is-playing', state.playing);
        root.classList.toggle('is-editing', editing);

        if(lobbyControls){
            lobbyControls.hidden = !state.waiting || editing;
        }

        if(editButton){
            editButton.hidden = !!state.highScoresVisible || !!state.ready;
        }

        if(playButton){
            playButton.hidden = !!state.highScoresVisible || !!state.ready;
        }

        if(actionControls){
            actionControls.hidden = !showGameplayControls;
        }

        if(joystick){
            joystick.hidden = !showGameplayControls;
        }

        if(!showGameplayControls){
            resetJoystick();
            input.release(' ');
        }

        if(!editing){
            updateAimHandle(typeof state.aimLevel === 'number' ? state.aimLevel : getAimLevel());
        }
    }

    function clamp(value, min, max){
        return Math.max(min, Math.min(max, value));
    }

    init();

    return {
        update: update
    };
};
