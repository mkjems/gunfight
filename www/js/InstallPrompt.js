GF.InstallPrompt = (function(){
    var deferredInstallPrompt = null;
    var promptElement;
    var promptTextElement;
    var promptButton;
    var closeButton;
    var dismissedStorageKey = 'gunfight-install-prompt-dismissed';

    function init(){
        registerServiceWorker();

        promptElement = document.getElementById('installPrompt');
        promptTextElement = document.getElementById('installPromptText');
        promptButton = document.getElementById('installPromptButton');
        closeButton = document.getElementById('installPromptClose');

        if(!promptElement || isStandalone() || wasDismissed()){
            return;
        }

        bindEvents();
        updateInstructionText();
        showIfTouchDevice();
    }

    function registerServiceWorker(){
        if(!('serviceWorker' in navigator)){
            return;
        }

        if(isLocalDevelopment()){
            navigator.serviceWorker.getRegistrations().then(function(registrations){
                registrations.forEach(function(registration){
                    registration.unregister();
                });
            }).catch(function(){});
            return;
        }

        if(!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'){
            return;
        }

        window.addEventListener('load', function(){
            navigator.serviceWorker.register('/sw.js').catch(function(){});
        });
    }

    function isLocalDevelopment(){
        return window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '';
    }

    function bindEvents(){
        window.addEventListener('beforeinstallprompt', function(evt){
            evt.preventDefault();
            deferredInstallPrompt = evt;

            if(promptButton){
                promptButton.hidden = false;
            }

            showIfTouchDevice();
        });

        window.addEventListener('appinstalled', hide);

        if(closeButton){
            closeButton.addEventListener('click', function(){
                localStorage.setItem(dismissedStorageKey, '1');
                hide();
            });
        }

        if(promptButton){
            promptButton.addEventListener('click', function(){
                if(!deferredInstallPrompt){
                    return;
                }

                deferredInstallPrompt.prompt();
                deferredInstallPrompt.userChoice.finally(function(){
                    deferredInstallPrompt = null;
                    promptButton.hidden = true;
                });
            });
        }
    }

    function updateInstructionText(){
        if(!promptTextElement){
            return;
        }

        if(isIOS()){
            promptTextElement.textContent = 'SHARE - ADD TO HOME SCREEN';
            return;
        }

        promptTextElement.textContent = 'MENU - INSTALL APP';
    }

    function showIfTouchDevice(){
        if(!promptElement || !isTouchDevice() || isStandalone() || wasDismissed()){
            return;
        }

        promptElement.hidden = false;
        promptElement.classList.add('is-visible');
    }

    function hide(){
        if(!promptElement){
            return;
        }

        promptElement.classList.remove('is-visible');
        promptElement.hidden = true;
    }

    function isTouchDevice(){
        return window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    }

    function isStandalone(){
        return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    }

    function isIOS(){
        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }

    function wasDismissed(){
        try{
            return localStorage.getItem(dismissedStorageKey) === '1';
        } catch(err){
            return false;
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        hide: hide
    };
}());
