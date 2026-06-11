GF.AmmoHudRenderer = function (options) {
    options = options || {};

    var context = options.context;
    var sprite = options.sprite;

    function render(count, x, y, direction) {
        var i;
        var roundX;
        var scale = GF.Config.graphics.scale;
        var spriteWidth = 7 * scale;
        var spriteHeight = 16 * scale;
        var spacing = 10 * scale;

        context.save();
        context.fillStyle = GF.Config.colors.yellow;
        context.shadowColor = 'rgb(0,0,0)';
        context.shadowOffsetX = 3;
        context.shadowOffsetY = 3;

        for (i = 0; i < count; i++) {
            roundX = x + i * spacing * direction;

            if (sprite && sprite.complete) {
                context.drawImage(sprite, roundX, y, spriteWidth, spriteHeight);
            } else {
                context.fillRect(roundX, y, spriteWidth, spriteHeight);
            }
        }

        context.restore();
    }

    return {
        render: render
    };
};
