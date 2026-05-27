import { getDailyWord, getRandomWord } from '../services/wordleService.js';



export async function daily(req, res) {
    const { difficulty } = req.params;
    const correctGuess = getDailyWord(difficulty);
    return res.status(200).json({
        correctGuess,
    });
}

export async function play(req, res) {
    const { difficulty } = req.params;
    const correctGuess = getRandomWord(difficulty);
    return res.status(200).json({
        correctGuess
    });
}