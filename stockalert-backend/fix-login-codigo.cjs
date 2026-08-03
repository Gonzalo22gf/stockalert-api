const fs = require("fs");
let t = fs.readFileSync("src/pages/LoginPage.jsx", "utf8");

// Cambiar placeholder del campo empresa en modo "unir"
t = t.replace(
  'placeholder="Nombre de la empresa a la que te unes"',
  'placeholder="Codigo de acceso (ej: CARR-3354)"'
);

// Cambiar label explicativo del modo "unir"
t = t.replace(
  'Te sumas como jefe a una sucursal de una empresa ya registrada.',
  'Ingresa el codigo de acceso que te dio el administrador de la empresa.'
);

// Cambiar placeholder del campo empresa en modo "crear" (sigue siendo el nombre)
// ya esta bien, no hay que tocarlo

fs.writeFileSync("src/pages/LoginPage.jsx", t);
console.log("OK - LoginPage con codigo de acceso");
