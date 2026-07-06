import { fetchProducts } from './api.js';

// VARIABLE ÚNICA PARA LOGO Y PESTAÑA DE NAVEGADOR
const LINK_DEL_LOGO = 'https://drive.google.com/thumbnail?id=110PUZNIxNsSS9wk2g3EGyMkhLAKJmfpt&sz=w1000';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');

// Aplica el logo a la Pestaña (Favicon), Header y Footer
function aplicarLogo() {
  // 1. Pestaña del navegador
  const favicon = document.getElementById('favicon');
  if (favicon) {
    favicon.href = LINK_DEL_LOGO;
  }

  // 2. Imágenes dentro de la página (Header y Footer)
  const logos = document.querySelectorAll('.brand-logo');
  logos.forEach(img => {
    img.src = LINK_DEL_LOGO;
    // Evitar que la imagen rota se vea antes de cargar
    img.onerror = () => { img.style.display = 'none'; };
    img.onload = () => { img.style.display = 'block'; };
  });
}

function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;

  // Intentamos obtener el carrito
  const data = localStorage.getItem('maravibewear_cart');
  let carrito = [];

  try {
    // Si hay datos, intentamos convertirlos
    if (data) {
      carrito = JSON.parse(data);
      // Validamos que sea realmente un array
      if (!Array.isArray(carrito)) {
        carrito = [];
        localStorage.removeItem('maravibewear_cart'); // Borramos lo corrupto
      }
    }
  } catch (e) {
    // Si hubo error al parsear, limpiamos
    carrito = [];
    localStorage.removeItem('maravibewear_cart');
  }

  // Ahora sí, hacemos el reduce de forma segura
  const total = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
  badge.textContent = total;
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
    // Si no hay precio por unidad, marcamos el bulto por defecto
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
    const nombreFinal = product.nombre + (tipoCompra === 'bulto' ? ` (${product.descBulto || 'Bulto'})` : '');
    const colorSeleccionado = colorGroup.hidden ? '' : colorSelect.value;
    const talleSeleccionado = sizeGroup.hidden ? '' : sizeSelect.value;
    
    const idUnico = `${product.id}-${tipoCompra}-${colorSeleccionado}-${talleSeleccionado}`;

    const itemCart = {
      idUnico: idUnico,
      idProducto: product.id,
      nombre: nombreFinal,
      precio: precioSeleccionado,
      imagen: product.imagenes[0],
      color: colorSeleccionado,
      talle: talleSeleccionado,
      cantidad: qty
    };

    let carrito = JSON.parse(localStorage.getItem('maravibewear_cart')) || [];
    const index = carrito.findIndex(i => i.idUnico === itemCart.idUnico);
    
    if (index !== -1) {
      carrito[index].cantidad += qty; 
    } else {
      carrito.push(itemCart); 
    }
    
    localStorage.setItem('maravibewear_cart', JSON.stringify(carrito));
    updateCartBadge();

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
  updateCartBadge(); 
  
  try {
    const products = await fetchProducts();
    if (!products || products.length === 0) {
      throw new Error("El Google Script devolvió una lista vacía. Verificá las columnas de tu Excel.");
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
