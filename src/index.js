import dotenv from "dotenv";
import app from "./app.js";
import DbConnection from "./db/DbConnection.js";

dotenv.config({path:'./.env'});

DbConnection().then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`server is runnig at PORT http://localhost:${process.env.PORT}/api/v1/users`)
    })
})