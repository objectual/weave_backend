const express = require('express');
const router = express.Router();

import { AuthMiddleware } from "../http/middleware/auth";
import { RoleMiddleware } from "../http/middleware/role";
import { Redis } from "./cache.controller";

const redis_controller = new Redis();

router.get('/keys/get', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), redis_controller.getKeys)

router.delete('/keys/delete', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), redis_controller.flushdb)

router.delete('/keys/delete/auth', AuthMiddleware.isAuthenticated(), RoleMiddleware.isAdmin(), redis_controller.flushAuth)

module.exports = router;