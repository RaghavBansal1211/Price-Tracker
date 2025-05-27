const { getUser } = require("../services/auth");

async function restrictToLoggedInUserOnly(req,res,next){
    const userid = req.headers['authorization'];

    if(!userid) return res.status(404).json({
        message:"Token not found"
    })

    const token = userid.split('Bearer ')[1]; 

    const user = getUser(token);
    
    if(!user) return res.status(404).json({
        message:"User Not found"
    });

    req.user = user;
    next();
}

module.exports = {restrictToLoggedInUserOnly};
