
export async function globalErrorHandler(err, req, res, next) {

    // this handles all custom errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message
        });
    }

    // generic errors handled here

    console.error(`Error: Message: ${err.message}`);


    return res.status(500).json({
        success: false,
        message: `Internal Server Error`
    });

}
