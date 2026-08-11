// Consulta Open Food Facts para autocompletar datos del producto por EAN
// API gratuita, sin registro, sin limite de requests

const CATEGORIAS_MAPEADAS = {
  "en:beverages": "Bebidas",
  "en:dairies": "Lacteos",
  "en:frozen-foods": "Congelados",
  "en:cleaning-agents": "Limpieza",
  "en:groceries": "Almacen",
  "en:dairy": "Lacteos",
  "en:drinks": "Bebidas",
  "en:milks": "Lacteos",
  "en:waters": "Bebidas",
  "en:juices": "Bebidas",
  "en:yogurts": "Lacteos",
};

function mapearCategoria(categoriasTags) {
  if (!categoriasTags?.length) return "";
  for (const tag of categoriasTags) {
    if (CATEGORIAS_MAPEADAS[tag]) return CATEGORIAS_MAPEADAS[tag];
  }
  return "";
}

async function buscarEnOpenFoodFacts(ean) {
  try {
    const res = await fetch("https://world.openfoodfacts.org/api/v0/product/" + ean + ".json");
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const nombre = p.product_name_es || p.product_name || "";
    if (!nombre) return null;
    return {
      nombre,
      categoria: mapearCategoria(p.categories_tags),
      imagen: p.image_url || ""
    };
  } catch {
    return null;
  }
}

async function buscarEnUPCItemDB(ean) {
  try {
    const res = await fetch("https://api.upcitemdb.com/prod/trial/lookup?upc=" + ean);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items?.length) return null;
    const item = data.items[0];
    return {
      nombre: item.title || "",
      categoria: "",
      imagen: item.images?.[0] || ""
    };
  } catch {
    return null;
  }
}

export async function buscarProductoPorEAN(ean) {
  // Intentar primero Open Food Facts
  const resultado = await buscarEnOpenFoodFacts(ean);
  if (resultado) return resultado;
  // Fallback: UPC Item DB (mejor cobertura latinoamericana)
  return await buscarEnUPCItemDB(ean);
}
