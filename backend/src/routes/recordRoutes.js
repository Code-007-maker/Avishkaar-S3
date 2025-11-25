import express from "express";
import { createRecord, deleteRecord, addDoctorNote, getRecords } from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/", protect, createRecord);   
router.delete("/:id", protect, deleteRecord);

router.post("/:id/doctor-note", protect, addDoctorNote);
router.get("/", protect, getRecords); 

export default router;
