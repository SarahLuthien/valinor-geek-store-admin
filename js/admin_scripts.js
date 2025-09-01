
const API_URL = "https://6690791ac0a7969efd9c2716.mockapi.io/products";

const tableBody = document.getElementById('product-table-body');
const addProductBtn = document.getElementById('addProductBtn');

// Elementos do Modal de Produto
const productModal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const productForm = document.getElementById('productForm');
const modalTitle = document.getElementById('modalTitle');
const productIdInput = document.getElementById('productId');

// Elementos do Modal de Exclusão
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteModalText = document.getElementById('deleteModalText');

// Elemento da Notificação (Toast)
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

let productsCache = [];
let productToDeleteId = null;

// --- FUNÇÕES DA API ---

async function getProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Não foi possível buscar os produtos.");
    const data = await response.json();
    productsCache = data.sort((a, b) => a.name.localeCompare(b.name)); // Guarda e ordena
    return productsCache;
  } catch (error) {
    console.error("Erro na API:", error);
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-red-500">${error.message}</td></tr>`;
  }
}

async function createProduct(productData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error("Falha ao criar produto.");
  return await response.json();
}

async function updateProduct(id, productData) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData)
  });
  if (!response.ok) throw new Error("Falha ao atualizar produto.");
  return await response.json();
}

async function deleteProductApi(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) throw new Error("Falha ao excluir produto.");
  return await response.json();
}


// --- LÓGICA DE RENDERIZAÇÃO E UI ---

function renderTable() {
  if (!productsCache || productsCache.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-gray-500">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  tableBody.innerHTML = ''; // Limpa a tabela
  productsCache.forEach(product => {
    const tr = document.createElement('tr');
    tr.className = 'border-b hover:bg-gray-50';
    tr.innerHTML = `
            <td class="p-4 flex items-center gap-4">
                <img src="${product.imagem}" alt="${product.name}" class="w-16 h-16 object-contain rounded-md bg-gray-200" onerror="this.src='https://placehold.co/64x64/EEE/31343C?text=Imagem'">
                <span class="font-semibold">${product.name}</span>
            </td>
            <td class="p-4 text-gray-700">R$ ${parseFloat(product.price).toFixed(2)}</td>
            <td class="p-4 text-center">
                <button data-action="edit" data-id="${product.id}" class="text-blue-600 hover:text-blue-800 font-semibold mr-4">Editar</button>
                <button data-action="delete" data-id="${product.id}" class="text-red-600 hover:text-red-800 font-semibold">Excluir</button>
            </td>
        `;
    tableBody.appendChild(tr);
  });
}

function showToast(message, isError = false) {
  toastMessage.textContent = message;
  // Define a cor baseada no tipo de mensagem
  toast.className = toast.className.replace(/bg-.*-500/, isError ? 'bg-red-500' : 'bg-green-500');

  // remove as classes que escondem o toast
  toast.classList.remove('opacity-0', '-translate-y-20');
  // Adiciona as classes que mostram o toast na posição final
  toast.classList.add('opacity-100', 'translate-y-0');

  // Animação de saída com time
  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', '-translate-y-20');
  }, 3000);
}


// --- MODAL LÓGICA ---

function openProductModal(product = null) {
  productForm.reset();
  if (product) {
    modalTitle.textContent = "Editar Produto";
    productIdInput.value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('price').value = product.price;
    document.getElementById('image').value = product.imagem;
  } else {
    modalTitle.textContent = "Adicionar Novo Produto";
    productIdInput.value = '';
  }
  productModal.classList.remove('hidden');
}

function closeProductModal() {
  productModal.classList.add('hidden');
}

function openDeleteModal(id) {
  productToDeleteId = id;
  const product = productsCache.find(p => p.id === id);
  deleteModalText.innerHTML = `Você tem certeza que deseja excluir o produto <strong class="text-black">"${product.name}"</strong>?`;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
}

// --- MANIPULADORES DE EVENTOS (EVENT HANDLERS) ---

async function handleFormSubmit(event) {
  event.preventDefault();
  const id = productIdInput.value;
  const productData = {
    name: document.getElementById('name').value,
    price: parseFloat(document.getElementById('price').value),
    imagem: document.getElementById('image').value,
  };

  try {
    if (id) {
      await updateProduct(id, productData);
      showToast("Produto atualizado com sucesso!");
    } else {
      await createProduct(productData);
      showToast("Produto adicionado com sucesso!");
    }
    closeProductModal();
    await getProducts();
    renderTable();
  } catch (error) {
    showToast(error.message, true);
  }
}

function handleTableClick(event) {
  const target = event.target.closest('button');
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === 'edit') {
    const product = productsCache.find(p => p.id === id);
    openProductModal(product);
  } else if (action === 'delete') {
    openDeleteModal(id);
  }
}

async function handleConfirmDelete() {
  try {
    await deleteProductApi(productToDeleteId);
    showToast("Produto excluído com sucesso!");
    closeDeleteModal();
    await getProducts();
    renderTable();
  } catch (error) {
    showToast(error.message, true);
  }
}

// --- INICIALIZAÇÃO E EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', async () => {
  await getProducts();
  renderTable();

  // Botões principais
  addProductBtn.addEventListener('click', () => openProductModal());
  tableBody.addEventListener('click', handleTableClick);

  // Eventos do Modal de Produto
  productForm.addEventListener('submit', handleFormSubmit);
  closeModalBtn.addEventListener('click', closeProductModal);
  cancelModalBtn.addEventListener('click', closeProductModal);

  // Eventos do Modal de Exclusão
  confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Fechar modais ao clicar fora
  productModal.addEventListener('click', (e) => e.target === productModal && closeProductModal());
  deleteModal.addEventListener('click', (e) => e.target === deleteModal && closeDeleteModal());
});

