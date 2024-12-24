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
    let details={   
      Category:req.body.category.toUpperCase(),
      Discription:req.body.discription
    }
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
    res.render('admin/editCategory',{sessionName,editCategoryData});
  }

  const editCategoryLast=async function(req,res){
    console.log(req.body);
    let id=req.params.id
    await Categorycoll.updateOne({_id:id},{$set:{
    Category:req.body.category,
    Discription:req.body.discription,
    Status:req.body.status
    }})
    res.redirect('/admin/category')
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