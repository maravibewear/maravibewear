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

    // Conectar evento para abrir el modal al hacer clic en la tarjeta
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
  document.getElementById('modalMainImg').src = product.imagenes[0] || '';
  
  // 2. Llenar "Tipo de compra" (Radio buttons)
  const modalPrices = document.getElementById('modalPrices');
  modalPrices.innerHTML = ''; // Limpiar opciones anteriores
  
  if (product.precioUnidad > 0) {
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="unidad" checked>
        Unidad - $${product.precioUnidad}
      </label>
    `;
  }
  if (product.precioBulto > 0) {
    modalPrices.innerHTML += `
      <label>
        <input type="radio" name="tipoCompra" value="bulto">
        Bulto - $${product.precioBulto}
      </label>
    `;
  }

  // 3. Llenar "Color"
  const colorGroup = document.getElementById('colorGroup');
  const colorSelect = document.getElementById('modalColor');
  colorSelect.innerHTML = ''; // Limpiar opciones anteriores
  
  if (product.colores && product.colores.length > 0) {
    colorGroup.hidden = false; // Mostrar el grupo si hay colores
    product.colores.forEach(color => {
      colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
    });
  } else {
    colorGroup.hidden = true; // Ocultar si este producto no tiene colores
  }

  // 4. Llenar "Talle"
  const sizeGroup = document.getElementById('sizeGroup');
  const sizeSelect = document.getElementById('modalSize');
  sizeSelect.innerHTML = ''; // Limpiar opciones anteriores
  
  if (product.talles && product.talles.length > 0) {
    sizeGroup.hidden = false; // Mostrar el grupo si hay talles
    product.talles.forEach(talle => {
      sizeSelect.innerHTML += `<option value="${talle}">${talle}</option>`;
    });
  } else {
    sizeGroup.hidden = true; // Ocultar si este producto no tiene talles
  }

  // 5. Lógica del selector de Cantidad (+ y -)
  let qty = 1;
  const qtyVal = document.getElementById('modalQtyVal');
  qtyVal.textContent = qty; // Resetear a 1 al abrir

  // Remover eventos anteriores para evitar que se sumen múltiples veces
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
  
  // Lógica para cerrar el modal
  document.getElementById('closeModal').onclick = () => {
    modal.hidden = true;
  };
}

async function init() {
  try {
    const products = await fetchProducts();
    
    if (!products || products.length === 0) throw new Error("No hay productos");

    // Éxito: Ocultar carga y mostrar la grilla
    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    
    renderProducts(products);

  } catch (error) {
    // Error: Ocultar carga y mostrar botón de reintentar
    loadingState.style.display = 'none';
    errorState.hidden = false;
    console.error("Error al inicializar:", error);
  }
}

// Iniciar aplicación
document.addEventListener('DOMContentLoaded', init);
