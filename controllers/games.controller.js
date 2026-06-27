import * as GameService from '../services/games.service.js';

export async function start(req, res) {
    const user = req.user;
    const isHardMode = req.query.isHardMode === 'true';
    const gameID = await GameService.startGame(user, isHardMode);
    return res.status(200).json({
        success: true,
        gameID,
        message: "New Game Created Successfully"
    });
}


export async function guess(req, res) {
    const user = req.user;
    const gameID = req.params.gameID;
    const { guess } = req.body;
    const { result, isGameOver, isWinner } = await GameService.makeGuess(user, guess, gameID);
    return res.status(200).json({
        success: true,
        result,
        isGameOver,
        isWinner
    });
}

export async function skip(req, res) {
    const user = req.user;
    const isHardMode = req.query.isHardMode === 'true';
    const gameID = req.params.gameID;
    const nextGameID = await GameService.nextGame(user, gameID, isHardMode);
    return res.status(200).json({
        success: true,
        message: "Game Skipped Successfully",
        gameID: nextGameID,
    });
}

export async function remove(req, res) {
    const user = req.user;
    const gameID = req.params.gameID;
    await GameService.deleteGame(user, gameID);
    return res.status(200).json({
        success: true,
        message: "Game Deleted Successfully"
    });
}


export async function getGame(req, res) {
    const user = req.user;
    const gameID = req.params.gameID;
    const game = await GameService.getGame(user, gameID);
    return res.status(200).json({
        success: true,
        game
    });
}


export async function getAll(req, res) {
    const user = req.user;
    const games = await GameService.getAllGames(user);
    return res.status(200).json({
        success: true,
        games
    });
}