const fs = require("fs");
let t = fs.readFileSync("src/components/Sidebar.jsx", "utf8");
t = t.replace(
  "LayoutDashboard, Package, Activity, Store, Users, TrendingUp, Link, KeyRound, ShieldCheck,",
  "LayoutDashboard, Package, Activity, Store, Users, TrendingUp, Link, KeyRound, ShieldCheck, CreditCard,"
);
fs.writeFileSync("src/components/Sidebar.jsx", t);
console.log("OK");
