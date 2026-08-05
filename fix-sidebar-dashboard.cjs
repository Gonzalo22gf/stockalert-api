const fs = require("fs");
let t = fs.readFileSync("src/components/Sidebar.jsx", "utf8");
t = t.replace(
  '<ItemNav to="/" Icono={LayoutDashboard} label="Dashboard" soloAdmin esAdmin={esAdmin} onNavegar={onCerrar} colapsado={colapsado} />',
  '<ItemNav to="/" Icono={LayoutDashboard} label="Dashboard" onNavegar={onCerrar} colapsado={colapsado} />'
);
fs.writeFileSync("src/components/Sidebar.jsx", t);
console.log("OK - Dashboard visible para todos en sidebar");
