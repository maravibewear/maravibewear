import { fetchProducts } from './api.js';
import { addToCart, renderCart, updateQuantity, removeFromCart, sendWhatsAppOrder, getCart } from './cart.js';

const LINK_DEL_LOGO = 'https://drive.google.com/thumbnail?id=110PUZNIxNsSS9wk2g3EGyMkhLAKJmfpt&sz=w1000';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');
const categoryFilters = document.getElementById('categoryFilters');

let allProducts = []; // Guardamos los productos para el filtro

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

function updateCartUI() {
  const bodyEl = document.getElementById('cartBody');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const badgeEl = document.getElementById('cartBadge');
  
  if (bodyEl && footerEl && totalEl && badgeEl) {
    renderCart(bodyEl, footerEl, totalEl, badgeEl);
  }
}

// NUEVO: Renderiza los botones de categorías
function renderCategoryFilters(products) {
  if (!categoryFilters) return;
  const categories = ['Todas', ...new Set(products.map(p => p.categoria).filter(Boolean))];
  
  if (categories.length <= 2) { // Si solo hay "Todas" y 1 categoría, ocultar
    categoryFilters.hidden = true;
    return;
  }
  
  categoryFilters.hidden = false;
  categoryFilters.innerHTML = categories.map(cat => 
    `<button class="filter-btn ${cat === 'Todas' ? 'active' : ''}" data-cat="${cat}">${cat}</button>`
  ).join('');

  categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remover clase active de todos y dar al clickeado
      categoryFilters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Filtrar y renderizar
      const cat = e.target.dataset.cat;
      const filtered = cat === 'Todas' ? products : products.filter(p => p.categoria === cat);
      renderProducts(filtered);
    });
  });
}

function renderProducts(products) {
  productsGrid.innerHTML = '';
  if (products.length === 0) {
    productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos en esta categoría.</p>';
    return;
  }
  
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

  // Lógica Correlativa Color/Talle
  const colorGroup = document.getElementById('colorGroup');
  const colorSelect = document.getElementById('modalColor');
  const sizeGroup = document.getElementById('sizeGroup');
  const sizeSelect = document.getElementById('modalSize');
  
  colorSelect.innerHTML = ''; 
  sizeSelect.innerHTML = '';

  const hasVariantes = Object.keys(product.variantes || {}).length > 0;

  if (product.colores && product.colores.length > 0) {
    colorGroup.hidden = false;
    product.colores.forEach(color => {
      colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
    });
  } else { colorGroup.hidden = true; }

  // Función que actualiza talles según el color elegido
  const updateSizes = () => {
    sizeSelect.innerHTML = '';
    let availableSizes = product.talles;
    
    if (hasVariantes) {
      const selectedColor = colorSelect.value;
      availableSizes = product.variantes[selectedColor] || [];
    }

    if (availableSizes && availableSizes.length > 0) {
      sizeGroup.hidden = false;
      availableSizes.forEach(talle => {
        sizeSelect.innerHTML += `<option value="${talle}">${talle}</option>`;
      });
    } else {
      sizeGroup.hidden = true;
    }
  };

  if (product.talles && product.talles.length > 0) {
    if (hasVariantes) {
      // Si cambia el color, actualizamos los talles
      colorSelect.addEventListener('change', updateSizes);
    }
    updateSizes(); // Render inicial
  } else {
    sizeGroup.hidden = true;
  }

  let qty = 1;
  const qtyVal = document.getElementById('modalQtyVal');
  qtyVal.textContent = qty;
  document.getElementById('modalQtyMinus').onclick = () => { if (qty > 1) { qty--; qtyVal.textContent = qty; } };
  document.getElementById('modalQtyPlus').onclick = () => { qty++; qtyVal.textContent = qty; };

  const btnAddToCart = document.getElementById('modalAddToCart');
  const newBtnAddToCart = btnAddToCart.cloneNode(true);
  btnAddToCart.parentNode.replaceChild(newBtnAddToCart, btnAddToCart);
  
  newBtnAddToCart.onclick = () => {
    const radioSeleccionado = document.querySelector('input[name="tipoCompra"]:checked');
    if (!radioSeleccionado) return; 

    const options = {
      tipo: radioSeleccionado.value,
      precio: radioSeleccionado.value === 'unidad' ? product.precioUnidad : product.precioBulto,
      color: colorGroup.hidden ? '' : colorSelect.value,
      talle: sizeGroup.hidden ? '' : sizeSelect.value
    };

    addToCart(product, qty, options);
    updateCartUI(); 

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
  updateCartUI(); 
  
  const cartToggle = document.getElementById('cartToggle');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const closeCart = document.getElementById('closeCart');
  const btnCheckout = document.getElementById('btnCheckout');
  
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
  if (btnCheckout) btnCheckout.addEventListener('click', sendWhatsAppOrder);
  
  try {
    allProducts = await fetchProducts();
    if (!allProducts || allProducts.length === 0) throw new Error("Lista vacía");

    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    
    renderCategoryFilters(allProducts); // Renderizamos filtros
    renderProducts(allProducts); // Renderizamos todo

  } catch (error) {
    loadingState.style.display = 'none';
    errorState.hidden = false;
    console.error("Error crítico:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);
