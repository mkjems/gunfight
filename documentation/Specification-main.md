# Gunfight main specification

Gunfight is a browser-based remake of the 1975 arcade game. It is a single-page web app served by Express and synchronized through Socket.IO. The goal is a quick public arcade experience: open the site, get matched with a stranger, play a short duel, and leave.

The game runs in desktop browsers and mobile browsers. On mobile it should work best as an installed PWA launched from the home screen.

## Project goals

- Recreate the simple, tense feel of the original Gunfight.
- Keep the 1975 arcade look: pixel art, limited text, hard edges, short sounds, and immediate feedback.
- Let two players meet in a public lobby without accounts.
- Keep each match short enough for casual drop-in play.
- Add small original touches without losing the classic western duel.

## Screens

The app has four main screens:

- Lobby-main
- Lobby-edit-name
- Game
- High-scores

## Lobby screen

The lobby is the landing page and waiting room.

It shows:

- title `GUNFIGHT 1975`
- local player avatar, slot, name, and ready state
- opponent avatar, slot, name, and ready state when an opponent is connected
- desktop controls
- prompt to edit name
- prompt to play

The lobby does not show the game id or a separate local identity line. The lobby background shows the player's avatar. If an opponent is connected, both avatars are visible. On desktop, the player can move in the lobby to learn the controls, but cannot shoot.

Each avatar shows its player label and lobby state beneath the character. This text is rendered as HTML overlay text and follows the avatar while it moves. The status text changes with the player's lobby state; `READY` is shown as negative text. The local player is marked clearly before movement starts, for example with a small `YOU` marker or an equivalent local-only highlight. Lobby movement is constrained to side areas so avatars and their following labels stay readable and do not overlap the central lobby instructions.

While no player is ready, the app may rotate from the main lobby to high scores every 30 seconds. High scores are shown only when there has been no keyboard activity in the last 15 seconds.

### State of players in Lobby

- `LOOKING FOR CHALLENGER`: waiting for a second player.
- `WAITING`: player is present but not ready.
- `READY`: player has chosen to play.
- `OPPONENT LEFT`: matched opponent disconnected.

When both players are ready, the game starts.

When the local player has pressed `P` and entered `READY`, the lobby does not show `PRESS E TO EDIT NAME`, and pressing `E` does not open the edit name screen. Name editing becomes available again only after the local player returns to `WAITING`.

### Desktop lobby controls

- `E`: edit name, only while the local player is `WAITING`
- `P`: ready/play
- `H J K L`: move left, down, up, right
- `A Z`: aim up and down
- `Space`: shoot in game only

### Mobile lobby

Mobile users do not see keyboard instructions. The lobby uses touch buttons for edit name and play. Virtual movement and fire controls stay hidden until gameplay.

Mobile lobby action buttons are centered horizontally and vertically over the lobby screen so they remain visible when the scaled game stage is taller than the browser viewport.

On mobile high scores, only the top 5 score places are shown. The edit name and play buttons are shown underneath the high-score table, never over the table.

## Edit name screen

The edit name screen lets a player choose a public name before playing.

Rules:

- names are uppercase
- allowed characters are `A-Z` and `0-9`
- maximum length is 8 characters
- duplicate names in the same game receive a numeric suffix
- empty names are replaced with a random default name

Controls:

- desktop: `H J K L` move selection, `Space` selects, `E` submits
- touch: tap letters and actions directly or use the virtual controls.

Actions:

- `DEL`: delete last character
- `RND`: choose a random default name
- `OK`: submit name

Name is stored in the browser (session or local storage ) so you can work on that total high score.

## Game screen

The game screen contains the battlefield, players, bullets, obstacles, HUD, score, timer, and hit messages.

Each match lasts 70 seconds total. The timer starts when the first duel begins and does not reset between kills, reloads, or later duels. Players may score as many kills as possible before time runs out. The winner is the player with the highest score when the timer reaches zero.

### HUD layout

- Player names appear on the bottom HUD line next to the ammo graphics.
- Each name is placed on the inside edge of its player's ammo display, between that ammo display and the centerline.
- The left and right name placements are symmetrical.
- Names face inward toward the centerline, matching the opposing ammo layout.

### Round flow

1. Both players enter ready state.
2. Players walk into position.
3. The screen shows `GET READY` at the center of the screen.
4. The screen shows `DRAW !` at the center of the screen.
5. The duel begins.
6. A hit pauses the game, awards one point, reloads both players, and starts the next duel.
7. When the match timer ends, the game shows `GAME OVER` with the winning player name or `TIE` and the final score, keeps it visible briefly, and returns to the lobby.

### Gameplay rules

- Each player starts a duel with limited ammo.
- Shooting consumes one bullet.
- A hit kills the opponent and scores one point.
- Both players reload after each kill.
- If both players run out of bullets, both reload.
- Bullets can hit players and damage selected obstacles.
- Some bullets can ricochet.
- A disconnected opponent returns the remaining player to the lobby state.

### Desktop game controls

- `H J K L`: move left, down, up, right
- `A Z`: aim up and down
- `Space`: fire

### Mobile game controls

Mobile gameplay uses touch controls:

- joystick for movement
- vertical aim control
- fire button

Mobile rendering may use a camera that follows the local player so the battlefield remains readable on small screens.

## High scores screen

The high scores screen lists recent performance across games.

The high scores screen does not show lobby or gameplay characters in the background.

The high scores table always shows 10 ranked rows. Empty score rows still show their place label and leave the remaining cells blank; the screen does not show a `NO SCORES YET` message.

Expected columns:

- place
- player name
- wins
- kills
- deaths

Scores are stored in server memory. They survive while the server process is running and are lost on restart.

## Authoring tools

The app should include browser-based editor pages for game content.

### Rock editor

The rock editor is a WYSIWYG page for editing the dimensions and polygon shape of a rock.

Expected behavior:

- The page is reachable separately from normal play.
- The editor shows a visual preview of the rock.
- The user can edit rock dimensions and shape directly in the preview.
- The editor accepts rock JSON as input.
- The editor outputs rock JSON that can be copied into the project data files.
- Invalid JSON or invalid rock geometry is shown clearly without crashing the editor.

### Scenario editor

The scenario editor is a WYSIWYG page for editing a full game scenario.

Expected behavior:

- The page is reachable separately from normal play.
- The editor shows a visual preview of the scenario in the game arena.
- The user can place and adjust scenario elements such as rocks, cacti, wagons, saloons, decorations, and player start positions.
- The editor accepts scenario JSON as input.
- The editor outputs scenario JSON that can be copied into the project data files.
- Invalid JSON or invalid scenario geometry is shown clearly without crashing the editor.

## Matchmaking and networking

The server creates two-player game rooms.

Server responsibilities:

- serve the web client
- assign player ids and game ids
- pair waiting players into games
- store player names and ready state
- choose the current scenario
- relay input, position, obstacle damage, and round events inside each room
- mark games as waiting, readying, playing, abandoned, or closed

Client responsibilities:

- render the game
- apply local input immediately
- apply remote input when received
- run the local game loop
- move players and bullets by elapsed time
- detect hits and obstacle damage
- draw HUD, lobby, and name editor state

## PWA and mobile behavior

The app includes a web manifest and service worker support. Mobile users should be encouraged to add the game to the home screen for full-screen play.

Mobile-specific behavior:

- show rotate-to-landscape prompt when needed
- avoid desktop keyboard instructions
- hide lobby messages while install instructions are visible
- keep touch controls large and stable
- account for safe areas and browser chrome

## Visual and audio style

- low-resolution pixel art
- arcade fonts
- western objects such as cacti, wagons, rocks, and saloons
- short sound effects for ready, gunshot, empty gun, hit, ricochet, and obstacle hits
- minimal text, written like cabinet-era arcade UI
