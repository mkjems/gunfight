
# Gunfight

A web remake of the classic arcade game, that used to be the hottest thing in my local grill.

### How it will work
 
When the client loads the page, the client does:

* Syncs watch
* listen for planning events
  * Adds them to schedule
* Starts animation loop, Request animation frame. (Different framerate for each player)

### The Loop
    
* Update world
   * Check Schedule and change Model accordingly.(What should happen in this frame)
   * NB. The world is also the state of the keys of the keyboard.    
   * Move everything one tick.
* Send Change events of user input to server. Never change the model directly. So it will happen in aprox 100ms but in sync across all participating browsers. 
* Paint world