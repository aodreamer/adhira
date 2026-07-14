const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const validate = require("../middleware/validate");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const individuController = require("../controllers/individu.controller");
const dashboardController = require("../controllers/dashboard.controller");
const { loginSchema, registerSchema } = require("../validators/auth.validator");
const { createUserSchema, updateUserSchema } = require("../validators/user.validator");
const {
  pemberitahuanRouter,
  laporanRouter,
  usulanRouter,
  distribusiRouter,
} = require("./document.routes");
const verifikatorRouter = require("./verifikator.routes");

router.post("/auth/login", authController.loginLimiter, validate(loginSchema), authController.login);
router.get("/auth/me", authenticate, authController.me);
router.post("/auth/register", authController.registerLimiter, validate(registerSchema), authController.register);

router.get("/dashboard", authenticate, authorize("Admin"), dashboardController.index);

router.get("/users", authenticate, authorize("Admin"), userController.list);
router.post("/users", authenticate, authorize("Admin"), validate(createUserSchema), userController.create);
router.get("/users/dashboard/stats", authenticate, authorize("Admin"), userController.stats);
router.get("/users/:id", authenticate, authorize("Admin"), userController.getById);
router.put("/users/:id", authenticate, authorize("Admin"), validate(updateUserSchema), userController.update);
router.delete("/users/:id", authenticate, authorize("Admin"), userController.remove);

router.get("/individu", authenticate, authorize("Admin"), individuController.list);
router.post("/individu", authenticate, authorize("Admin"), individuController.create);
router.get("/individu/filters", authenticate, authorize("Admin"), individuController.filters);
router.get("/individu/:id", authenticate, authorize("Admin"), individuController.getById);
router.put("/individu/:id", authenticate, authorize("Admin"), individuController.update);
router.delete("/individu/:id", authenticate, authorize("Admin"), individuController.remove);
router.get("/individu/:id/download/:fileColumn", authenticate, authorize("Admin"), individuController.download);

router.use("/pemberitahuan", authenticate, authorize("Admin"), pemberitahuanRouter);
router.use("/laporan", authenticate, authorize("Admin"), laporanRouter);
router.use("/usulan", authenticate, authorize("Admin"), usulanRouter);
router.use("/distribusi", authenticate, authorize("Admin"), distribusiRouter);

router.use("/user/self", authenticate, require("./user-self.routes"));
router.use("/verifikator", authenticate, authorize("Verifikator"), verifikatorRouter);

module.exports = router;