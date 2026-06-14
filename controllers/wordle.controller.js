// import { game } from '../models/gameModel.js';
// import { makeGuess, nextGame, startGame } from '../services/wordleService.js';






// export async function start(req, res, next) {
//     const isHardMode = req.query.isHardMode === 'true';
//     const gameID = startGame(isHardMode);
//     return res.status(200).json({
//         success: true,
//         gameID
//     });
// }

// export async function play(req, res, next) {
//     const isHardMode = req.query.isHardMode === 'true';
//     const gameID = req.query.gameID;
//     const { guess } = req.body;
//     const { result, isGameOver } = makeGuess(guess, gameID, isHardMode);
//     return res.status(200).json({
//         success: true,
//         result,
//         isGameOver
//     });
// }

// export async function skipGame(req, res, next) {
//     const isHardMode = req.query.isHardMode === 'true';
//     const gameID = req.query.gameID;
//     const nextGameID = nextGame(gameID, isHardMode);
//     return res.status(200).json({
//         success: true,
//         nextGameID
//     });
// }