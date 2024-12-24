 
 const {Admin}=require('../model/adminModel')
 
//  const adminAuth1=function(erq,res,next){
//    const admin=req.session.admin_id;
//    if(admin){
//     next()
//    }
//    else{
//     return redirect('/admin/')
//    }
// }

const adminAuth = async (req, res, next) => {
    const link = req.headers.referer || req.originalUrl;
  try {

      if (req.session.admin_id) {
          const admin = await Admin.findOne({ _id: req.session.admin_id, isAdmin: true });

          if (admin) {
              console.log("Admin authentication successful");
              return next();
          } else {
              console.log("Admin authentication failed");
              return res.render("admin/error",{
                  res, 
                  errorCode:401, 
                  errorMessage:"Unauthorized", 
                  errorDescription:"Admin access denied. Please login.", 
                  link:"/admin/login", 
                  // true
                }
              );
          }
      } else {
          req.session.adminReturnTo = req.originalUrl;
          return res.render("admin/error",{
              res, 
              errorCode:403, 
              errorMessage:"Forbidden", 
              errorDescription:"You don't have permission to access this page.", 
              link, 
              // true
            }
          );
      }
  } catch (error) {
      console.error("Error during admin authentication:", error);
      return res.render("admin/error",{
          res, 
          errorCode:500, 
          errorMessage:"Internal Server Error", 
          errorDescription:"An error occurred during admin authentication.", 
          link, 
          // true
          }
      );
  }
};

module.exports=adminAuth