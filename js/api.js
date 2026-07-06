/**
 * api.js — Comunicación con Google Apps Script (Google Sheets)
 */

/** @type {string} URL del endpoint JSON de Google Apps Script */
export const API_URL = 'https://script.google.com/macros/s/AKfycbyMIxQSkPgixtqnaeezNo-99H-K_aSdAmbCMCpj1Ng7nULiJX0cgZvBvsPE8Am7czLI/exec'; // <-- PEGA TU NUEVA URL ACA

export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\/lh3\.googleusercontent\.com/i.test(trimmed)) return trimmed;
  const fileMatch = trimmed.match(/\/file\/d\/([^\/]+)/);
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
  return trimmed;
}

export function normalizeProduct(raw) {
  if (!raw) return null;
  const id = String(raw.id ?? raw.ID ?? '').trim();
  const nombre = String(raw.nombre ?? raw.Nombre ?? raw.name ?? '').trim();
  if (!id) return null;

  // Separa las imágenes por coma y las procesa
  const imagenes = String(raw.imagen ?? raw.Imagen ?? '').split(',').map(u => normalizeImageUrl(u.trim())).filter(Boolean);
  
  return {
    id,
    nombre,
    descripcion: String(raw.descripcion ?? raw.Descripcion ?? '').trim(),
    imagenes: imagenes.length > 0 ? imagenes : [''], // La primera es la portada [0]
    categoria: String(raw.categoria ?? raw.Categoria ?? 'General').trim(),
    enStock: String(raw.stock ?? raw.Stock ?? 'si').toLowerCase() !== 'no',
    colores: String(raw.color ?? raw.Color ?? '').split(',').map(c => c.trim()).filter(Boolean),
    talles: String(raw.talles ?? raw.Talles ?? '').split(',').map(t => t.trim()).filter(Boolean),
    precioUnidad: parseFloat(raw.precio_unidad ?? raw.preciounidad ?? raw.precio ?? 0) || 0,
    precioBulto: parseFloat(raw.precio_bulto ?? raw.preciobulto ?? 0) || 0,
    descBulto: String(raw.desc_bulto ?? raw.descbulto ?? 'Bulto').trim(), // Lee la columna desc_bulto
  };
}

export async function fetchProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error de red');
    const data = await response.json();
    return data.map(normalizeProduct).filter(Boolean);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
}
