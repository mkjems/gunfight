GF.ClientGameSounds = function (options) {
    options = options || {};

    var soundEffects = options.soundEffects || new GF.SoundEffects();

    function play(name) {
        if (soundEffects) {
            soundEffects.play(name);
        }
    }

    function playObstacleHit(id) {
        if (id === 'wagon') {
            play('wagonHit');
            return;
        }

        if (id && id.indexOf('cactus:') === 0) {
            play('cactusHit');
        }
    }

    return {
        playEmptyGun: function () {
            play('emptyGun');
        },
        playGun: function () {
            play('gunshot');
        },
        playObstacleHit: playObstacleHit,
        playPain: function () {
            play('pain');
        },
        playReady: function () {
            play('ready');
        },
        playRicochet: function () {
            play('ricochet');
        }
    };
};
