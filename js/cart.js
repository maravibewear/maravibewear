const STORAGE_KEY = 'maravibewear_cart';
export const WHATSAPP_NUMBER = '5491157089345';

let cart = loadCart();

function loadCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } 
  catch { return []; }
}

function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

export function getCart() { return cart; }

export function getCartItemCount() {
  return cart.reduce((total, item) => total + item.cantidad, 0);
}

export function addToCart(product, quantity, options) {
  const variantId = `${product.id}-${options.tipo}-${options.color}-${options.talle}`;
  const existing = cart.find(i => i.variantId === variantId);
  if (existing) {
    existing.cantidad += quantity;
  } else {
    cart.push({
      variantId, id: product.id, nombre: product.nombre, 
      imagen: product.imagenes[0], precio: options.precio,
      tipo: options.tipo, color: options.color, talle: options.talle,
      cantidad: quantity, descBulto: product.descBulto
    });
  }
  saveCart();
}

export function updateQuantity(variantId, newQty) {
  const item = cart.find(i => i.variantId === variantId);
  if (item) {
    item.cantidad = Math.max(1, newQty); // Evita que baje de 1
    saveCart();
  }
}

export function removeFromCart(variantId) {
  cart = cart.filter(i => i.variantId !== variantId);
  saveCart();
}

export function clearCart() { cart = []; saveCart(); }

export function formatPrice(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
}

function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<"'>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m] || '&#039;');
}

export function renderCart(bodyEl, footerEl, totalEl, badgeEl) {
  badgeEl.textContent = getCartItemCount();
  badgeEl.hidden = cart.length === 0;

  if (cart.length === 0) {
    bodyEl.innerHTML = '<p class="cart-empty-msg">Tu carrito está vacío.</p>';
    footerEl.hidden = true;
    return;
  }
  
  footerEl.hidden = false;
  const total = cart.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
  totalEl.textContent = formatPrice(total);

  bodyEl.innerHTML = cart.map(item => {
    const details = [
      item.tipo === 'bulto' ? `Bulto (${item.descBulto})` : 'Unidad',
      item.color ? `Color: ${item.color}` : '',
      item.talle ? `Talle: ${item.talle}` : ''
    ].filter(Boolean).join(' | ');

    return `
    <div class="cart-item">
      <img class="cart-item__image" src="${item.imagen}" alt="${escapeHtml(item.nombre)}">
      <div class="cart-item__info">
        <span class="cart-item__name">${escapeHtml(item.nombre)}</span>
        <span style="font-size: 11px; color: #666; display: block; margin-bottom: 4px;">${escapeHtml(details)}</span>
        <span class="cart-item__price">${formatPrice(item.precio)} c/u</span>
        <div class="cart-item__controls">
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn qty-minus" data-vid="${item.variantId}">−</button>
            <span class="cart-item__qty-value">${item.cantidad}</span>
            <button class="cart-item__qty-btn qty-plus" data-vid="${item.variantId}">+</button>
          </div>
          <span class="cart-item__subtotal">${formatPrice(item.precio * item.cantidad)}</span>
        </div>
        <button class="cart-item__remove remove-item" data-vid="${item.variantId}">Eliminar</button>
      </div>
    </div>`;
  }).join('');

  // --- ASIGNACIÓN DIRECTA DE EVENTOS A LOS BOTONES DEL CARRITO ---
  
  // Botón Restar
  bodyEl.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const vid = btn.dataset.vid;
      const item = cart.find(i => i.variantId === vid);
      if (item) {
        updateQuantity(vid, item.cantidad - 1);
        renderCart(bodyEl, footerEl, totalEl, badgeEl); // Volvemos a dibujar
      }
    });
  });

  // Botón Sumar
  bodyEl.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const vid = btn.dataset.vid;
      const item = cart.find(i => i.variantId === vid);
      if (item) {
        updateQuantity(vid, item.cantidad + 1);
        renderCart(bodyEl, footerEl, totalEl, badgeEl); // Volvemos a dibujar
      }
    });
  });

  // Botón Eliminar
  bodyEl.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.vid);
      renderCart(bodyEl, footerEl, totalEl, badgeEl); // Volvemos a dibujar
    });
  });
}

export function sendWhatsAppOrder() {
  if (cart.length === 0) return;
  const total = cart.reduce((sum, i) => sum + (i.precio * i.cantidad), 0);
  let msg = '¡Hola! Quiero hacer el siguiente pedido:\n\n';
  cart.forEach(i => {
    msg += `- ${i.cantidad}x ${i.nombre}\n`;
    msg += `  Tipo: ${i.tipo === 'bulto' ? `Bulto (${i.descBulto})` : 'Unidad'}\n`;
    if (i.color) msg += `  Color: ${i.color}\n`;
    if (i.talle) msg += `  Talle: ${i.talle}\n`;
    msg += `  Subtotal: ${formatPrice(i.precio * i.cantidad)}\n\n`;
  });
  msg += `*Total: ${formatPrice(total)}*`;
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}
