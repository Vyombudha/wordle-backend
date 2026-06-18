

/**
 * takes times in minutes, converts into ms
 * @param {number} timeInMinute
 * @returns {number} the time in ms  
 */
export function minutesToMs(timeInMinutes) {
    return timeInMinutes * (60 * 1000);
}



/**
 * takes times in days, converts into ms
 * @param {number} timeInDays 
 * @returns {number} the time in Ms
 */
export function daysToMs(timeInDays) {
    return timeInDays * minutesToMs(1440);
}
