# Gunfight TODO3

## P2 - Lobby redesign

- [x] Show main lobby screen for 30 secs and high score screen for only 7 secs
- [x] Redesign the main lobby into a simpler arcade title screen.
    - [x] Remove the game ID from the main lobby.
    - [x] Remove the separate redundant local player name line.
    - [x] Keep `GUNFIGHT 1975` centered near the top.
    - [x] Show desktop controls in the center: movement, aim, and shoot.
    - [x] Show `PRESS E TO EDIT NAME` and `PRESS P TO PLAY` centered below the controls.
    - [x] Keep the player characters moving in the lobby background.
    - [x] Place each player's name and lobby state beneath their character.
    - [x] Make the name/state text follow the character while it moves.
    - [x] Show `READY` status as negative text.
    - [x] Keep each lobby character inside an invisible side-area so the character and following text stay readable and do not drift into the central lobby instructions.
    - [x] Make the local player obvious before movement starts, for example with a small `YOU` marker above the local character or a subtle local-only highlight around the local name.
    - [x] Keep opponent labeling symmetrical: `PLAYER 1 - NAME` on the left side and `PLAYER 2 - NAME` on the right side, with `WAITING` or `READY` beneath.
- [x] Do not show characters in the background on the high-scores-page.

## P2.1 - Lobby redesign follow up

- [x] New rule: Only switch to the high score screen every 30 secs AND only if there has been no keyboard activity in the last 15 seconds.
- [x] The High score screen should have column at the beginning called 'Place'. It should have the row text 1ST, 2ND, 3RD, 5TH, etc .. up to 10TH
- [x] Always show 10 high-score rows with place labels and no `NO SCORES YET` text.
- [x] I would like all the text to be real HTML text. Canvas text is blurry and the negative text looks inconsistent with html text. Can you make the html text follow the character
- [x] Should we adjust specifications with some of these design changes - to not have stale specs.

## P3 - Content Authoring Tools

### P3.1 Add a rock editor page.

- [ ] Add a rock editor page.
    - [ ] Provide a WYSIWYG preview for rock dimensions and polygon shape.
    - [ ] Accept rock JSON as input.
    - [ ] Output rock JSON for copying into project data.
    - [ ] Validate JSON and geometry with readable errors.

## P3.5 Add a scenario editor page.

- [ ] Add a scenario editor page.
    - [ ] Provide a WYSIWYG preview of the full arena scenario.
    - [ ] Let the user place and adjust rocks, cacti, wagons, saloons, decorations, and player start positions.
    - [ ] Accept scenario JSON as input.
    - [ ] Output scenario JSON for copying into project data.
    - [ ] Validate JSON and scenario geometry with readable errors.

## P4 - Later Ideas

- [ ] Add persistent high scores with a database.
- [ ] Add private room codes.
- [ ] Add spectator mode.
- [ ] Add optional rematch flow.
- [ ] Add a small original story or Stranger Things-style twist.
- [ ] Add more sounds, animations, and scenario themes.
