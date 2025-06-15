const { signUp,login } = require("../controllers/authController")

const authRoute=async (req,res,body)=>{
    if(req.method==='POST' && req.url==='/auth/register'){
        return signUp(req,res,body);
    }

    if(req.method==='POST' && req.url==='/auth/login'){
        return login(res,res,body);
    }
}

module.exports=authRoute;