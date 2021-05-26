import expess from "express"; 
import { userRouter } from "../app/http/controller/api/user";
import { userAdminRouter } from "../app/http/controller/api/user/admin";
const app = expess();


app.use("/users", userRouter); 

app.use("/users/admin", userAdminRouter); 

module.exports = app;