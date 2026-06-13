# Gunfight TODO4

## State Model improvements

### P3.3 - State model review and future plans

- [ ] We should look into the current state model a come up with an improvement.
- [ ] We should look into if disconnect and re-connect are handled correct from mobile and desktop.
- [ ] How do we pair up players who have lost they opponent? Do we use alone players? or wait for their old opponents to reconnect.
- [x] Should you be able to be in ready state when you have no opponent? No. `READY` requires a connected opponent.
- [x] If a player loses their opponent because of disconnect or reload, the remaining player loses `READY` state and returns to waiting for an opponent.
- [ ] When two players are alone in separate waiting games, automatically pair them into one game.
- [ ] When pairing previously alone players, clear ready state for both players.
- [ ] Do not pair players out of `playing` games; only pair `waiting` single-player games.

## Content Authoring Tools

### Add a rock editor page.

- [ ] Add a rock editor page.
    - [ ] Provide a WYSIWYG preview for rock dimensions and polygon shape.
    - [ ] Accept rock JSON as input.
    - [ ] Output rock JSON for copying into project data.
    - [ ] Validate JSON and geometry with readable errors.

### Add a scenario editor page.

- [ ] Add a scenario editor page.
    - [ ] Provide a WYSIWYG preview of the full arena scenario.
    - [ ] Let the user place and adjust rocks, cacti, wagons, saloons, decorations, and player start positions.
    - [ ] Accept scenario JSON as input.
    - [ ] Output scenario JSON for copying into project data.
    - [ ] Validate JSON and scenario geometry with readable errors.

## Improve visual effects

### Add particle layer for more special effects

## Other Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
- [ ] Add the number of wins/kills after the name in the lobby: LUKE 5/10

## MAYBE bad Ideas

- [ ] After the game. Players should see the high score page for a period of time, before returning to main lobby.
- [ ] When both players have marked themselves as ready - I would like a leave-lobby-for-game-sequence. I would like the lobby screen to keep the players in the lobby for a few seconds so you can see the READY status in negative text for 2 seconds and hear the ready sound before switching to the game screen.
- [ ] We should collect all game constants like this leave-lobby-pause-duration above in some central shared place.
- [ ] On Desktop, after a game. 'Game over' should continue to be shown in the main lobby as should the last game result in the top line.
