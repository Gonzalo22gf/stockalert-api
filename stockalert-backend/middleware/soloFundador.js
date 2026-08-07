// Lista de emails fundadores en variable de entorno
// FUNDADORES_EMAILS=gonzalo@gmail.com,otro@gmail.com
const soloFundador = (req, res, next) => {
  const emails = (process.env.FUNDADORES_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  const emailUsuario = req.usuario?.email?.toLowerCase();
  if (!emailUsuario || !emails.includes(emailUsuario)) {
    return res.status(403).json({ mensaje: "Acceso restringido al fundador" });
  }
  next();
};
module.exports = { soloFundador };
