const User= require('../model/userModel')

const userAuth = async (req, res, next) => {
    try {
        const link = req.headers.referer || req.originalUrl;

        if (req.session.user_id) {
            const user = await User.findById(req.session.user_id);

            if (user && user.Status) {
                console.log("User authentication successful");
                return next();
            } else {
                console.log("User authentication failed: Blocked or not found");

                if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                    // If it's an AJAX request, send a JSON response
                    return res.status(401).json({
                        success: false,
                        message: "Access denied. Please log in.",
                        redirectUrl: "/login"
                    });
                } else {
                    // For normal requests, redirect to login page
                    return res.status(401).render('user/error',{
                        res ,
                        errorCode:401 ,
                        errorMessage:"Unauthorized" ,
                        errorDescription: "Access denied. Please login." ,
                        link:"/login"
                    }
                    );
                }
            }
        } else {
            console.log("Session not found");
            req.session.userReturnTo = req.originalUrl;
    
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(401).json({
                    success: false,
                    message: "Session expired. Please log in.",
                    redirectUrl: "/login"
                });
            } else {
                return res.render("user/error", {
                    res, 
                    errorCode: 401, 
                    errorMessage: "Unauthorized", 
                    errorDescription: "Session expired. Please login again.", 
                    link:"/login"
                 }
                );
            }
        }
    } catch (error) {
        console.error("Error during user authentication:", error);
        return res.render('user/error', {
            res, 
           errorCode: 500, 
           errorMessage: "Internal Server Error", 
           errorDescription: "An error occurred during authentication.", 
            link 
         }
        );
    }
};

module.exports = userAuth;