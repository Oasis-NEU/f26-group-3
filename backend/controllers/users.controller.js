// GET /api/users/me  ->  the logged-in student
export function getMe(req, res) {
  res.json({ user: { id: req.user.id, email: req.user.email } });
}