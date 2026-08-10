// Protege endpoints que solo puede disparar el cron de GitHub Actions.
// El cron envia el header x-cron-secret con la clave secreta.
function protegerCron(req, res, next) {
  const secreto = req.headers["x-cron-secret"];
  if (!process.env.CRON_SECRET || secreto !== process.env.CRON_SECRET) {
    return res.status(401).json({ mensaje: "No autorizado" });
  }
  next();
}
module.exports = { protegerCron };
