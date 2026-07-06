import { fetchProducts } from './api.js';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');

// Función básica para inyectar las tarjetas en el HTML
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
        <p class="product-card__price">$${product.precioUnidad}</p>
      </div>
    `;

    card.addEventListener('click', () => openModal(product));
    productsGrid.appendChild(card);
  });
}

// Lógica completa del Modal
function openModal(product) {
  const modal = document.getElementById('productModal');
  
  // 1. Textos e imagen principal
  document.getElementById('modalTitle').textContent = product.nombre;
  document.getElementById('modalDesc').textContent = product.descripcion || '';
  
  const modalMainImg = document.getElementById('modalMainImg');
  modalMainImg.src = product.imagenes[0] || ''; // Portada

  // 1.5 Galería de imágenes (Miniaturas)
  const modalThumbs = document.getElementById('modalThumbs');
  modalThumbs.innerHTML = ''; // Limpiar miniaturas anteriores
  
  if (product.imagenes.length > 1) {
    product.imagenes.forEach((imgUrl, index) => {
      const thumb = document.createElement('img');
      thumb.src = imgUrl;
      thumb.alt = `Miniatura ${index + 1}`;
      if (index === 0) thumb.classList.add('active');
      
      // Al hacer clic en una miniatura, cambia la imagen principal
      thumb.addEventListener('click', () => {
        modalMainImg.src = imgUrl;
        // Cambiar la clase activa
        modalThumbs.querySelectorAll('img').forEach(img => img.classList.remove('active'));
        thumb.classList.add('active');
      });
      
      modalThumbs.appendChild(thumb);
    });
  }

  // 2. Llenar "Tipo de compra" (Radio buttons)
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
    // Aquí usamos descBulto para mostrar el texto que venga del Excel
    const desc = product.descBulto || 'Bulto';
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="bulto">
        ${desc} - $${product.precioBulto}
      </label>
    `;
  }

  // 3. Llenar "Color"
  const colorGroup = document.getElementById('colorGroup');
  const colorSelect = document.getElementById('modalColor');
  colorSelect.innerHTML = ''; 
  
  if (product.colores && product.colores.length > 0) {
    colorGroup.hidden = false;
    product.colores.forEach(color => {
      colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
    });
  } else {
    colorGroup.hidden = true;
  }

  // 4. Llenar "Talle"
  const sizeGroup = document.getElementById('sizeGroup');
  const sizeSelect = document.getElementById('modalSize');
  sizeSelect.innerHTML = ''; 
  
  if (product.talles && product.talles.length > 0) {
    sizeGroup.hidden = false;
    product.talles.forEach(talle => {
      sizeSelect.innerHTML += `<option value="${talle}">${talle}</option>`;
    });
  } else {
    sizeGroup.hidden = true;
  }

  // 5. Lógica del selector de Cantidad (+ y -)
  let qty = 1;
  const qtyVal = document.getElementById('modalQtyVal');
  qtyVal.textContent = qty;

  const btnMinus = document.getElementById('modalQtyMinus');
  const btnPlus = document.getElementById('modalQtyPlus');
  
  btnMinus.onclick = () => {
    if (qty > 1) {
      qty--;
      qtyVal.textContent = qty;
    }
  };
  
  btnPlus.onclick = () => {
    qty++;
    qtyVal.textContent = qty;
  };

  // Mostrar el modal
  modal.hidden = false;
  
  // Cerrar el modal
  document.getElementById('closeModal').onclick = () => {
    modal.hidden = true;
  };
}

async function init() {
  try {
    const products = await fetchProducts();
    
    if (!products || products.length === 0) throw new Error("No hay productos");

    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    
    renderProducts(products);

  } catch (error) {
    loadingState.style.display = 'none';
    errorState.hidden = false;
    console.error("Error al inicializar:", error);
  }
}

document.addEventListener('DOMContentLoaded', init);
