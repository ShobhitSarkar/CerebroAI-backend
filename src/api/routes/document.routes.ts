// src/api/routes/document.routes.ts
import { Router } from 'express';

const router = Router();

// Routes will be implemented later
router.post('/upload', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;