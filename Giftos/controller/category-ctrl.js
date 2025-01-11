const Categorycoll= require('../model/categoryModel')
const Productscoll = require('../model/productModel')




let msg;

//category get sesson
const categoryget=async function(req,res,next){
    try {
        const sessionName=req.session.admin_id
        const findCategory=await Categorycoll.find({})
        console.log(findCategory);
        // res.render('Category1',{findCategory,msg})
        res.render('admin/adminCategory',{sessionName:sessionName,findCategory,msg})
        msg=null 
    } catch (error) {
        console.log('error in categoryget',error.mesage)
        res.render('user/error',{error:error.message})
    }
 
}


const categoryPost = async function (req, res, next) {
  let details = {   
    Category: req.body.category.trim().toUpperCase(), // Trim spaces and convert to uppercase
    Discription: req.body.discription.trim() // Trim spaces
  };
    console.log(details.Category);
    if(details.Category==""){
      msg="Category field is empty"
     return res.redirect('/admin/category')
    }else if(details.Discription==""){
      msg="Discription field is empty"
      return res.redirect('/admin/category')
    }
    else{
      let checkCategory = await Categorycoll.findOne({Category:details.Category})
      if(checkCategory==null){
        await Categorycoll.insertMany([details])
        res.redirect("/admin/category")
      }else{
        res.redirect('/admin/category')
        msg="This category already exist"
      }
    }
  }

  //edit category
const editCategoryget= async function(req, res){
    const sessionName=req.session.admin_id
    const editCategory=req.params.id
    const editCategoryData=await Categorycoll.findOne({_id:editCategory})
    res.render('admin/editCategory',{sessionName,editCategoryData,msg});
    msg=null 

  }

  const editCategoryLast=async function(req,res){
    try{
        console.log(req.body);
        let id=req.params.id
        const existingCategory = await Categorycoll.findOne({ _id: id });
        if (!existingCategory) {
            msg = "Category not found";
            return res.redirect(`/admin/editCategory/${id}`);
        }
        let details = {   
          Category: req.body.category.trim(), // Trim spaces and convert to uppercase
          Discription: req.body.discription.trim() // Trim spaces
        };
        console.log(details.Category);
        if(details.Category==""){
          msg="Category field is empty"
        return res.redirect(`/admin/editCategory/${id}`)
        }else if(details.Discription==""){
          msg="Discription field is empty"
          return res.redirect(`/admin/editCategory/${id}`)
        }
        // Check if the category name is being changed
        if (details.Category.toUpperCase() !== existingCategory.Category) {
          // Verify if the new category name already exists
          const categoryExists = await Categorycoll.findOne({ 
              Category: details.Category.toUpperCase(), 
              _id: { $ne: id } // Exclude the current category from the search
          });

          if (categoryExists) {
              msg = "This category name already exists";
              return res.redirect(`/admin/editCategory/${id}`);
          }
      }

      await Categorycoll.updateOne({_id:id},{$set:{
      Category:req.body.category.trim().toUpperCase(),
      Discription:req.body.discription.trim(),
      Status:req.body.status
      }})
      res.redirect('/admin/category')
    }catch (err) {
      console.log('error in editCategoryLast',err.mesage)
      res.render("admin/error", {
        res,
        errorCode: 500,
        errorMessage: "Server Error",
        errorDescription: "An unexpected error occurred while loading dashboard",
        link: req.headers.referer || "/admin",
      });
    }
  }

// delete category
const categoryDelete = async function(req, res, next){
    const categorydelete=req.params.id
     await Categorycoll.deleteOne({_id:categorydelete})
     res.redirect("/admin/category")
}

module.exports={
    categoryget,
    categoryPost,
    editCategoryget,
    categoryDelete,
    editCategoryLast
}