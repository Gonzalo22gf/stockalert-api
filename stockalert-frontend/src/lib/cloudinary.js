const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

/**
 * Sube una imagen a Cloudinary usando un upload preset sin firmar.
 * Devuelve la URL segura (https) de la imagen subida.
 * @param {File} file - archivo de imagen elegido por el usuario
 * @returns {Promise<string>} URL de la imagen en Cloudinary
 */
export async function subirImagen(file) {
  if (!file) throw new Error("No se seleccionó ninguna imagen.");
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error("Formato no válido. Usá JPG, PNG o WEBP.");
  }
  if (file.size > TAMANO_MAXIMO) {
    throw new Error("La imagen supera el tamaño máximo de 5 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo subir la imagen. Intentá de nuevo.");
  }

  const datos = await respuesta.json();
  return datos.secure_url;
}
