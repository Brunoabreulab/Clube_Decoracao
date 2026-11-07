const availableSizes = [
  { label: 'A5: 15 × 20 cm', value: 'A5 (15x20cm)', price: 29.90 },
  { label: 'A4: 20 × 30 cm', value: 'A4 (20x30cm)', price: 69.90 },
  { label: 'A3: 30 × 40 cm', value: 'A3 (30x40cm)', price: 89.90 },
  { label: 'A2: 40 × 60 cm', value: 'A2 (40x60cm)', price: 189.90 },
  { label: 'A1: 60 × 90 cm', value: 'A1 (60x90cm)', price: 389.90 }
];

const products = [
  { id: 1, title: 'Amar Navios', category: 'minimalista', imageSrc: 'imagens/quadro-decorativo (1).png' },
  { id: 2, title: 'Bauhaus - Elegância Listrada', category: 'design', imageSrc: 'imagens/quadro-decorativo.png' },
  { id: 3, title: 'Jazz Abstrato', category: 'abstrato', imageSrc: 'imagens/quadro-decorativo (2).png' },
  { id: 4, title: 'Juntos', category: 'minimalista', imageSrc: 'imagens/quadro-decorativo (3).png' },
  { id: 5, title: 'Abstrato Lua', category: 'abstrato', imageSrc: 'imagens/quadro-decorativo (4).png' },
  { id: 6, title: 'Tecido Ondulado', category: 'design', imageSrc: 'imagens/quadro-decorativo (5).png' },
  { id: 7, title: 'Quadro A', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.30.jpeg' },
  { id: 8, title: 'Quadro B', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.32.jpeg' },
  { id: 9, title: 'Quadro C', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.32fw.jpeg' },
  { id: 10, title: 'Quadro D', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.32jhvb.jpeg' },
  { id: 11, title: 'Quadro E', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.33.jpeg' },
  { id: 12, title: 'Quadro F', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.33rjdy.jpeg' },
  { id: 13, title: 'Quadro G', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.34.jpeg' },
  { id: 14, title: 'Quadro H', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.34fbfdb.jpeg' },
  { id: 15, title: 'Quadro I', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.35.jpeg' },
  { id: 16, title: 'Quadro J', category: 'design', imageSrc: 'imagens/WhatsApp Image 2026-10-12 at 09.59.39.jpeg' }
];

let cart = [];
let isCepValid = false;

function renderProducts(items) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = items.map(product => {
    // Define o preço inicial padrão (tamanho A5)
    const initialPrice = availableSizes[0].price;

    return `
      <div class="product-card">
        <div class="product-frame">
          <img class="product-img" src="${product.imageSrc}" alt="${product.title}" />
        </div>
        <div class="product-info">
          <h3 class="product-title">${product.title}</h3>
          <div class="product-category">Decoração</div>
          
          <div class="size-selector-container">
            <label for="size-${product.id}">Tamanho:</label>
            <select id="size-${product.id}" class="size-select" onchange="updateProductPrice(${product.id})">
              ${availableSizes.map(size => `<option value="${size.value}">${size.label}</option>`).join('')}
            </select>
          </div>

          <div class="product-price" id="price-${product.id}">R$ ${initialPrice.toFixed(2).replace('.', ',')}</div>
          <button class="add-to-cart" onclick="addToCart(${product.id})">Adicionar ao Carrinho</button>
        </div>
      </div>
    `;
  }).join('');
}

// Atualiza o valor exibido na tela no momento em que o usuário troca o tamanho no <select>
function updateProductPrice(productId) {
  const sizeSelect = document.getElementById(`size-${productId}`);
  const selectedSizeValue = sizeSelect ? sizeSelect.value : availableSizes[0].value;
  const sizeObj = availableSizes.find(s => s.value === selectedSizeValue);
  const priceDisplay = document.getElementById(`price-${productId}`);

  if (sizeObj && priceDisplay) {
    priceDisplay.innerText = `R$ ${sizeObj.price.toFixed(2).replace('.', ',')}`;
  }
}

function filterCategory(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    const btnText = btn.innerText.toLowerCase();
    if ((category === 'todos' && btnText === 'todos') || 
        (category === 'abstrato' && btnText.includes('abstrato')) ||
        (category === 'minimalista' && btnText.includes('minimalista')) ||
        (category === 'design' && btnText.includes('design'))) {
      btn.classList.add('active');
    }
  });

  if (category === 'todos') {
    renderProducts(products);
  } else {
    const filtered = products.filter(p => p.category === category);
    renderProducts(filtered);
  }
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  const sizeSelect = document.getElementById(`size-${productId}`);
  const selectedSizeValue = sizeSelect ? sizeSelect.value : availableSizes[0].value;

  // Busca o objeto do tamanho para pegar o preço correspondente
  const sizeObj = availableSizes.find(s => s.value === selectedSizeValue) || availableSizes[0];

  cart.push({
    ...product,
    selectedSize: sizeObj.value,
    price: sizeObj.price // Salva o preço correto do tamanho escolhido
  });

  updateCartUI();
  openCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateCartUI() {
  document.getElementById('cart-count').innerText = cart.length;
  
  const cartItemsContainer = document.getElementById('cart-items');
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; color:#888; margin-top:2rem;">Carrinho vazio</p>';
  } else {
    cartItemsContainer.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <span class="size-tag">Tamanho: ${item.selectedSize}</span>
          <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
        </div>
        <button class="remove-btn" onclick="removeFromCart(${index})">Remover</button>
      </div>
    `).join('');
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById('cart-total-price').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function openCart() {
  closeCheckout();
  document.getElementById('cart-modal').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-modal').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function goToCheckout() {
  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }
  closeCart();
  document.getElementById('checkout-modal').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

function closeAllModals() {
  closeCart();
  closeCheckout();
}

function formatCPF(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 11) value = value.slice(0, 11);
  
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  
  input.value = value;
}

function formatCEP(input) {
  let value = input.value.replace(/\D/g, '');
  if (value.length > 8) value = value.slice(0, 8);
  
  value = value.replace(/(\d{5})(\d)/, '$1-$2');
  input.value = value;
  isCepValid = false;
}

async function searchCEP() {
  const cepInput = document.getElementById('cep');
  const cepMessage = document.getElementById('cep-message');
  const cleanCEP = cepInput.value.replace(/\D/g, '');

  if (cleanCEP.length !== 8) {
    cepMessage.className = 'cep-message error';
    cepMessage.innerText = 'Informe um CEP válido com 8 dígitos.';
    isCepValid = false;
    return;
  }

  cepMessage.className = 'cep-message loading';
  cepMessage.innerText = 'Buscando CEP...';

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();

    if (data.erro) {
      cepMessage.className = 'cep-message error';
      cepMessage.innerText = 'CEP não encontrado. Por favor, verifique.';
      isCepValid = false;
    } else {
      document.getElementById('city').value = data.localidade || '';
      document.getElementById('state').value = data.uf || '';
      cepMessage.className = 'cep-message success';
      cepMessage.innerText = 'CEP válido e localizado!';
      isCepValid = true;
    }
  } catch (err) {
    if (/^\d{8}$/.test(cleanCEP)) {
      cepMessage.className = 'cep-message success';
      cepMessage.innerText = 'Formato de CEP aceito.';
      isCepValid = true;
    } else {
      cepMessage.className = 'cep-message error';
      cepMessage.innerText = 'Erro ao validar CEP.';
      isCepValid = false;
    }
  }
}

function validateCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

async function handleFinalCheckout(e) {
  e.preventDefault();

  const name = document.getElementById('full-name').value.trim();
  const cpf = document.getElementById('cpf').value;
  const email = document.getElementById('email').value.trim();
  const cep = document.getElementById('cep').value.replace(/\D/g, '');
  const city = document.getElementById('city').value.trim();
  const state = document.getElementById('state').value.trim();
  const number = document.getElementById('number').value.trim();

  if (cart.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const payload = {
    nome_completo: name,
    cpf: cpf,
    email: email,
    cep: cep,
    cidade: city,
    estado: state,
    numero: number,
    itens: cart.map(item => ({
      titulo: item.title,
      tamanho: item.selectedSize,
      preco: item.price,
      quantidade: 1
    }))
  };

  try {
    const response = await fetch('https://api-clube-decoracao.onrender.com/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.sucesso) {
      alert("Pedido realizado com sucesso!");
      cart = [];
      updateCartUI();
      document.getElementById('checkout-form').reset();
      closeAllModals();
    } else {
      alert(`Erro: ${result.detail || result.mensagem}`);
    }
  } catch (error) {
    alert("Erro ao conectar com a API Python.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const openCartBtn = document.getElementById('open-cart');
  if (openCartBtn) {
    openCartBtn.addEventListener('click', openCart);
  }

  // Renderização inicial dos produtos
  renderProducts(products);
});
