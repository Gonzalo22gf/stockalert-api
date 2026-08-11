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

export async function buscarProductoPorEAN(ean) {
  try {
    const res = await fetch(
      "https://world.openfoodfacts.org/api/v0/product/" + ean + ".json"
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    return {
      nombre: p.product_name || p.product_name_es || "",
      categoria: mapearCategoria(p.categories_tags),
      imagen: p.image_url || ""
    };
  } catch {
    return null;
  }
}
