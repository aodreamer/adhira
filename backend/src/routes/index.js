const express = require("express");
const router = express.Router();

const authenticate = require("../middleware/auth");
const authorize = require("../middleware/rbac");
const validate = require("../middleware/validate");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const individuController = require("../controllers/individu.controller");
const dashboardController = require("../controllers/dashboard.controller");
const { loginSchema, registerSchema, registerVerifikatorSchema } = require("../validators/auth.validator");
const { createUserSchema, updateUserSchema } = require("../validators/user.validator");
const {
  pemberitahuanRouter,
  laporanRouter,
  usulanRouter,
  distribusiRouter,
} = require("./document.routes");
const verifikatorRouter = require("./verifikator.routes");
const verifikatorImportRouter = require("./verifikator-import.routes");
const verifikatorRegistrationRouter = require("./verifikator-registration.routes");
const adminVerifikatorRegistrationController = require("../controllers/admin-verifikator-registration.controller");
const adminVerifikatorCodeController = require("../controllers/admin-verifikator-code.controller");

router.post("/auth/login", authController.loginLimiter, validate(loginSchema), authController.login);
router.get("/auth/me", authenticate, authController.me);
router.post("/auth/register", authController.registerLimiter, validate(registerSchema), authController.register);
router.post("/auth/register-verifikator", authController.registerLimiter, validate(registerVerifikatorSchema), authController.registerVerifikator);

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
router.put("/individu/:id/verifikasi-data", authenticate, authorize("Admin"), individuController.verifikasiData);
router.put("/individu/:id/verifikasi-berkas", authenticate, authorize("Admin"), individuController.verifikasiBerkas);

router.use("/pemberitahuan", authenticate, authorize("Admin"), pemberitahuanRouter);
router.use("/laporan", authenticate, authorize("Admin"), laporanRouter);
router.use("/usulan", authenticate, authorize("Admin"), usulanRouter);
router.use("/distribusi", authenticate, authorize("Admin"), distribusiRouter);

router.use("/user/self", authenticate, require("./user-self.routes"));
router.use("/verifikator/registration", authenticate, authorize("Verifikator"), verifikatorRegistrationRouter);
router.use("/verifikator/import", authenticate, authorize("Verifikator"), verifikatorImportRouter);
router.use("/verifikator", authenticate, authorize("Verifikator"), verifikatorRouter);

router.get("/admin/verifikator-registrations", authenticate, authorize("Admin"), adminVerifikatorRegistrationController.list);
router.get("/admin/verifikator-registrations/:id/download/:which", authenticate, authorize("Admin"), adminVerifikatorRegistrationController.download);
router.put("/admin/verifikator-registrations/:id", authenticate, authorize("Admin"), adminVerifikatorRegistrationController.review);

router.get("/admin/verifikator-codes", authenticate, authorize("Admin"), adminVerifikatorCodeController.list);
router.post("/admin/verifikator-codes", authenticate, authorize("Admin"), adminVerifikatorCodeController.create);
router.put("/admin/verifikator-codes/:id", authenticate, authorize("Admin"), adminVerifikatorCodeController.setActive);

module.exports = router;