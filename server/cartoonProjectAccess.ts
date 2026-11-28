import express from 'express';

interface StudioViewer {
  userId: string;
  isAdmin: boolean;
}

interface OwnedProject {
  ownerUserId?: string;
}

export function canAccessCartoonProject(viewer: StudioViewer, project: OwnedProject): boolean {
  return viewer.isAdmin || Boolean(project.ownerUserId && project.ownerUserId === viewer.userId);
}

export function createCartoonProjectAccessRouter(
  readIdentity: (header?: string) => Promise<StudioViewer | null>,
  getProject: (id: string) => OwnedProject | null,
) {
  const router = express.Router();
  router.use(async (req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      const viewer = await readIdentity(req.get('authorization'));
      if (!viewer) {
        res.status(401).json({ success: false, error: 'Sign in with a verified Studio account to access cartoon projects.' });
        return;
      }
      res.locals.studioViewer = viewer;
      next();
    } catch {
      res.status(503).json({ success: false, error: 'Studio account verification is temporarily unavailable.' });
    }
  });
  router.param('id', (_req, res, next, id) => {
    const project = getProject(id);
    if (!project || !canAccessCartoonProject(res.locals.studioViewer, project)) {
      res.status(404).json({ success: false, error: 'Cartoon project not found.' });
      return;
    }
    next();
  });
  return router;
}
