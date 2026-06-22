import * as GameService from '../services/wordle.service.js';





export async function start(req, res) {
    const user = req.validatedBody;
    const isHardMode = req.query.isHardMode === 'true';
    const gameID = GameService.startGame(user, isHardMode);
    return res.status(200).json({
        success: true,
        gameID
    });
}


export async function play(req, res) {
    const user = req.validatedBody;
    const isHardMode = req.query.isHardMode === 'true';
    const gameID = req.query.gameID;
    const { guess } = req.body;
    const { result, isGameOver } = GameService.makeGuess(user, guess, gameID);
    return res.status(200).json({
        success: true,
        result,
        isGameOver
    });
}

export async function skipGame(req, res) {
    const isHardMode = req.query.isHardMode === 'true';
    const gameID = req.query.gameID;
    const nextGameID = nextGame(gameID, isHardMode);
    return res.status(200).json({
        success: true,
        nextGameID
    });
}