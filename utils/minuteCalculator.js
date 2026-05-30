

/**
 * takes minutes and returns time in Ms
 * @param {number} timeInMinutes the time in numbers
 * @returns {number} the time in Milli seconds 
 */
export function minutesToMs(timeInMinutes) {
    return timeInMinutes * (60 * 1000);
}