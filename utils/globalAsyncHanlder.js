
/**
 * Takes in controller function as input returns a function that automatically calls the controller function catches errors and passed it to next() 
 * @param {Function} controllerFn  this the controller function being passed on
 * @returns {Function} 
 */
export const asyncHandler = (controllerFn) => {
    return (req, res, next) => {
        controllerFn(req, res, next).catch(next);
    };
};