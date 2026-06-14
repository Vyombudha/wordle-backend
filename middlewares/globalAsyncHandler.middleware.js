
/**
 * Takes in controller function, calls the controller function catches errors and passed it to next() 
 * @param {Function} controllerFn  this the controller function being passed on
 * @returns {Function} 
 */
export const asyncHandler = (controllerFn) => {
    return (req, res, next) => {
        controllerFn(req, res, next).catch(next);
    };
};