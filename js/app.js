import { fetchProducts } from './api.js';
import { addToCart, renderCart, updateQuantity, removeFromCart, sendWhatsAppOrder, getCart } from './cart.js';

// VARIABLE ÚNICA PARA LOGO Y PESTAÑA DE NAVEGADOR
const LINK_DEL_LOGO = 'https://drive.google.com/thumbnail?id=110PUZNIxNsSS9wk2g3EGyMkhLAKJmfpt&sz=w1000';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');

// Aplica el logo a la Pestaña (Favicon), Header y Footer
function aplicarLogo() {
  const favicon = document.getElementById('favicon');
  if (favicon) favicon.href = LINK_DEL_LOGO;

  const logos = document.querySelectorAll('.brand-logo');
  logos.forEach(img => {
    img.src = LINK_DEL_LOGO;
    img.onerror = () => { img.style.display = 'none'; };
    img.onload = () => { img.style.display = 'block'; };
  });
}

// Función centralizada para actualizar la interfaz del carrito
function updateCartUI() {
  const bodyEl = document.getElementById('cartBody');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const badgeEl = document.getElementById('cartBadge');
  
  if (bodyEl && footerEl && totalEl && badgeEl) {
    renderCart(bodyEl, footerEl, totalEl, badgeEl);
  }
}

function renderProducts(products) {
  productsGrid.innerHTML = '';
  
  products.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card__image-wrap">
        <img src="${product.imagenes[0] || ''}" alt="${product.nombre}" class="product-card__image">
      </div>
      <div class="product-card__body">
        <h3 class="product-card__name">${product.nombre}</h3>
        <p class="product-card__price">$${product.precioUnidad > 0 ? product.precioUnidad : product.precioBulto}</p>
      </div>
    `;

    card.addEventListener('click', () => openModal(product));
    productsGrid.appendChild(card);
  });
}

function openModal(product) {
  const modal = document.getElementById('productModal');
  
  document.getElementById('modalTitle').textContent = product.nombre;
  document.getElementById('modalDesc').textContent = product.descripcion || '';
  
  const modalMainImg = document.getElementById('modalMainImg');
  modalMainImg.src = product.imagenes[0] || ''; 

  const modalThumbs = document.getElementById('modalThumbs');
  modalThumbs.innerHTML = ''; 
  
  if (product.imagenes.length > 1) {
    product.imagenes.forEach((imgUrl, index) => {
      const thumb = document.createElement('img');
      thumb.src = imgUrl;
      thumb.alt = `Miniatura ${index + 1}`;
      if (index === 0) thumb.classList.add('active');
      
      thumb.addEventListener('click', () => {
        modalMainImg.src = imgUrl;
        modalThumbs.querySelectorAll('img').forEach(img => img.classList.remove('active'));
        thumb.classList.add('active');
      });
      modalThumbs.appendChild(thumb);
    });
  }

  const modalPrices = document.getElementById('modalPrices');
  modalPrices.innerHTML = ''; 
  
  if (product.precioUnidad > 0) {
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="unidad" checked>
        Unidad - $${product.precioUnidad}
      </label>
    `;
  }
  if (product.precioBulto > 0) {
    const desc = product.descBulto || 'Bulto';
    const isChecked = (product.precioUnidad <= 0) ? 'checked' : '';
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="bulto" ${isChecked}>
        ${desc} - $${product.precioBulto}
      </label>
    `;
  }

  const colorGroup = document.getElementById('colorGroup');
  const colorSelect = document.getElementById('modalColor');
  colorSelect.innerHTML = ''; 
  if (product.colores && product.colores.length > 0) {
    colorGroup.hidden = false;
    product.colores.forEach(color => {
      colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
    });
  } else { colorGroup.hidden = true; }

  const sizeGroup = document.getElementById('sizeGroup');
  const sizeSelect = document.getElementById('modalSize');
  sizeSelect.innerHTML = ''; 
  if (product.talles && product.talles.length > 0) {
    sizeGroup.hidden = false;
    product.talles.forEach(talle => {
      sizeSelect.innerHTML += `<option value="${talle}">${talle}</option>`;
    });
  } else { sizeGroup.hidden = true; }

  let qty = 1;
  const qtyVal = document.getElementById('modalQtyVal');
  qtyVal.textContent = qty;

  document.getElementById('modalQtyMinus').onclick = () => {
    if (qty > 1) { qty--; qtyVal.textContent = qty; }
  };
  document.getElementById('modalQtyPlus').onclick = () => {
    qty++; qtyVal.textContent = qty;
  };

  const btnAddToCart = document.getElementById('modalAddToCart');
  const newBtnAddToCart = btnAddToCart.cloneNode(true);
  btnAddToCart.parentNode.replaceChild(newBtnAddToCart, btnAddToCart);
  
  newBtnAddToCart.onclick = () => {
    const radioSeleccionado = document.querySelector('input[name="tipoCompra"]:checked');
    if (!radioSeleccionado) return; 

    const tipoCompra = radioSeleccionado.value;
    const precioSeleccionado = tipoCompra === 'unidad' ? product.precioUnidad : product.precioBulto;
    const colorSeleccionado = colorGroup.hidden ? '' : colorSelect.value;
    const talleSeleccionado = sizeGroup.hidden ? '' : sizeSelect.value;
    
    // Usamos el cart.js para añadir el producto (código limpio)
    const options = {
      tipo: tipoCompra,
      precio: precioSeleccionado,
      color: colorSeleccionado,
      talle: talleSeleccionado
    };

    addToCart(product, qty, options);
    updateCartUI(); // Actualizar visualmente el carrito y la insignia

    const textoOriginal = newBtnAddToCart.textContent;
    newBtnAddToCart.textContent = '¡Agregado!';
    newBtnAddToCart.style.backgroundColor = 'var(--color-success)'; 
    newBtnAddToCart.style.color = 'white';

    setTimeout(() => {
      newBtnAddToCart.textContent = textoOriginal;
      newBtnAddToCart.style.backgroundColor = ''; 
      newBtnAddToCart.style.color = '';
      modal.hidden = true; 
    }, 1200);
  };

  modal.hidden = false;
  document.getElementById('closeModal').onclick = () => { modal.hidden = true; };
}

async function init() {
  aplicarLogo(); 
  updateCartUI(); // Render inicial
  
  // Elementos del carrito
  const cartToggle = document.getElementById('cartToggle');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCart = document.getElementById('closeCart');
  const cartBody = document.getElementById('cartBody');
  const btnCheckout = document.getElementById('btnCheckout');
  
  // Lógica para abrir/cerrar carrito
  const openCartHandler = () => {
    if (cartOverlay) cartOverlay.classList.add('active');
    if (cartSidebar) cartSidebar.classList.add('active');
  };
  const closeCartHandler = () => {
    if (cartOverlay) cartOverlay.classList.remove('active');
    if (cartSidebar) cartSidebar.classList.remove('active');
  };

  if (cartToggle) cartToggle.addEventListener('click', openCartHandler);
  if (closeCart) closeCart.addEventListener('click', closeCartHandler);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartHandler);
  
  // Lógica para botones de +, - y Eliminar dentro del carrito
  if (cartBody) {
    cartBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const vid = btn.dataset.vid;
      
      if (btn.classList.contains('qty-plus')) {
        const item = getCart().find(i => i.variantId === vid);
        if (item) updateQuantity(vid, item.cantidad + 1);
      } else if (btn.classList.contains('qty-minus')) {
        const item = getCart().find(i => i.variantId === vid);
        if (item) updateQuantity(vid, item.cantidad - 1);
      } else if (btn.classList.contains('remove-item')) {
        removeFromCart(vid);
      }
      updateCartUI(); // Volvemos a pintar tras cada cambio
    });
  }

  // Envío a WhatsApp
  if (btnCheckout) {
    btnCheckout.addEventListener('click', sendWhatsAppOrder);
  }
  
  // Fetch a Google Sheets
  try {
    const products = await fetchProducts();
    if (!products || products.length === 0) {
      throw new Error("El Google Script devolvió una lista vacía.");
    }

    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    renderProducts(products);

  } catch (error) {
    loadingState.style.display = 'none';
    errorState.hidden = false;
    console.error("Error crítico al inicializar:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);
