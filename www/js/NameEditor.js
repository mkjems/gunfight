GF.NameEditor = function(options){
    options = options || {};

    var maxLength = options.maxLength || 8;
    var onSubmit = options.onSubmit || function(){};
    var active = false;
    var name = '';
    var cursorRow = 0;
    var cursorCol = 0;
    var grid = [
        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
        ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
        ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['<', 'RND', 'OK']
    ];
    var randomNames = [
        'ACE',
        'KID',
        'DOC',
        'RED',
        'JET',
        'MAX',
        'BUD',
        'CAL',
        'DUK',
        'IKE',
        'REX',
        'SAM'
    ];

    function sanitize(nextName){
        return String(nextName || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, maxLength);
    }

    function setName(nextName){
        name = sanitize(nextName);
    }

    function open(nextName){
        setName(nextName);
        active = true;
        cursorRow = 0;
        cursorCol = 0;
    }

    function close(options){
        options = options || {};
        active = false;

        if(options.submit && name){
            onSubmit(name);
        }
    }

    function move(dx, dy){
        cursorRow = Math.max(0, Math.min(grid.length - 1, cursorRow + dy));
        cursorCol = Math.max(0, Math.min(grid[cursorRow].length - 1, cursorCol + dx));
    }

    function selectCurrent(){
        var value = grid[cursorRow][cursorCol];

        if(value === '<'){
            name = name.slice(0, -1);
            return;
        }

        if(value === 'RND'){
            name = randomNames[Math.floor(Math.random() * randomNames.length)];
            onSubmit(name);
            return;
        }

        if(value === 'OK'){
            close({ submit: true });
            return;
        }

        if(name.length < maxLength){
            name += value;
        }
    }

    function handleKeyEvent(keyEvent){
        if(keyEvent.action !== 'down'){
            return active ? false : undefined;
        }

        if(!active && keyEvent.key === 'e'){
            open(name);
            return false;
        }

        if(!active){
            return undefined;
        }

        if(keyEvent.key === 'e'){
            close({ submit: true });
            return false;
        }

        if(keyEvent.key === 'h'){
            move(-1, 0);
            return false;
        }

        if(keyEvent.key === 'l'){
            move(1, 0);
            return false;
        }

        if(keyEvent.key === 'k'){
            move(0, -1);
            return false;
        }

        if(keyEvent.key === 'j'){
            move(0, 1);
            return false;
        }

        if(keyEvent.key === ' '){
            selectCurrent();
            return false;
        }

        return false;
    }

    function draw(drawer){
        var startX = 219;
        var startY = 238;
        var cellWidth = 64;
        var cellHeight = 34;

        drawer.text('EDIT NAME', 475, 154, 'center');
        drawer.text('NAME: ' + (name || ' '), 475, 190, 'center');

        grid.forEach(function(row, rowIndex){
            var rowX = startX + ((9 - row.length) * cellWidth / 2);

            row.forEach(function(value, colIndex){
                var x = rowX + (colIndex * cellWidth);
                var y = startY + (rowIndex * cellHeight);

                if(rowIndex === cursorRow && colIndex === cursorCol){
                    drawer.rect(x - 5, y - 5, cellWidth - 8, cellHeight - 7);
                }

                drawer.text(value, x + ((cellWidth - 14) / 2), y, 'center');
            });
        });

        drawer.text('H J K L MOVE', 475, 446, 'center');
        drawer.text('SPACE SELECT', 475, 470, 'center');
        drawer.text('E DONE', 475, 494, 'center');
    }

    return {
        close: close,
        draw: draw,
        handleKeyEvent: handleKeyEvent,
        isActive: function(){
            return active;
        },
        open: open,
        setName: setName
    };
};
