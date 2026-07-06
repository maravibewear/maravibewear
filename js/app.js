import { fetchProducts } from './api.js';
import { setProducts, renderProducts, renderCategoryFilters } from './products.js';

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const productsGrid = document.getElementById('productsGrid');

async function init() {
  try {
    const products = await fetchProducts();
    setProducts(products);
    
    // Ocultar carga y mostrar grid
    loadingState.style.display = 'none';
    productsGrid.hidden = false;
    
    renderCategoryFilters(
      document.getElementById('categoryFilters'), 
      document.getElementById('filtersSection'), 
      () => renderProducts(productsGrid, document.getElementById('emptyState'), document.getElementById('productCount'))
    );
    renderProducts(productsGrid, document.getElementById('emptyState'), document.getElementById('productCount'));
  } catch (error) {
    loadingState.style.display = 'none';
    errorState.hidden = false;
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', init);
