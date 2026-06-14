// import { hardWords } from '../data/hardWords.data.js';
// import { easyWords } from '../data/easyWords.data.js';
// import { VALID_WORDS } from '../data/validWords.data.js';
// import { GameNotFoundError, InvalidGuessError } from "../errors/gameErrors.js";
// import { v4 } from "uuid";
// import { minutesToMs } from "../utils/minuteCalculator.js";



// /**
//  * stores respective gameIDs and their game  state
//  * @type {Map<Number,game>}
//  */
// const gameStates = new Map();

// const GAME_TTL_MS = minutesToMs(30);
// /**
//  * Cleans up games that haven't been played for more than 30 minutes, every 5 minutes
//  */
// setInterval(() => {
//     const now = Date.now();
//     for (const [gameID, game] of gameStates) {
//         if ((now - game.lastActivity) > GAME_TTL_MS) gameStates.delete(gameID);
//     }
// }, minutesToMs(5));


// /**
//  * Take the current game difficulty, create a new gameId and game Object. Finally, stores it in gameState Map
//  * @param {boolean} isHardMode  current game diffculty parameter
//  * @returns {String} gameID
//  */
// export function startGame(isHardMode = false) {

//     let validAnswerArray = (isHardMode) ? hardWords : easyWords;
//     let gameID = v4();
//     let word = validAnswerArray[Math.floor(Math.random() * validAnswerArray.length)];
//     let currGame = new game(word);
//     gameStates.set(gameID, currGame);
//     return gameID;
// }

// /**
//  * Takes the gameID from current game and  difficulty mode for next game, delete the current game from gameStates finally, returns new gameID
//  * @param {string} gameID Id of the game we were on 
//  * @param {boolean} isHardMode  difficulty of next game 
//  * @returns {string} next gameID
//  */
// export function nextGame(gameID, isHardMode = false) {
//     // delete current GameId and return new gameID, doesnt matter if the game exists or not,
//     gameStates.delete(gameID);
//     return startGame(isHardMode);
// }


// /**
//  * 
//  * @param {string} guess the guess word for current chance
//  * @param {string} gameID the ID of current game
//  * @param {boolean} isHardMode  diffculty of current game, useful to know for when edgeCases and new game is to be created 
//  * @returns 
//  */
// export function makeGuess(guess, gameID, isHardMode = false) {

//     if (!gameStates.has(gameID)) throw new GameNotFoundError(gameID);
//     if (!VALID_WORDS.has(guess)) throw new InvalidGuessError(guess);

//     const currGame = gameStates.get(gameID);

//     const { isGameOver, result } = currGame.validateGuess(guess);

//     if (isGameOver) gameStates.delete(gameID);

//     return { isGameOver, result };
// }



