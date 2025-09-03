const API_URL = "https://6690791ac0a7969efd9c2716.mockapi.io/products";

const tableBody = document.getElementById("product-table-body");
const addProductBtn = document.getElementById("addProductBtn");

// Elementos do Modal de Produto
const productModal = document.getElementById("productModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const productForm = document.getElementById("productForm");
const modalTitle = document.getElementById("modalTitle");
const productIdInput = document.getElementById("productId");

// Elementos do Modal de Exclusão
const deleteModal = document.getElementById("deleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const deleteModalText = document.getElementById("deleteModalText");

// Elemento da Notificação (Toast)
const toastContainer = document.getElementById("toast-container");

let productsCache = [];
let productToDeleteId = null;

// --- FUNÇÕES AUXILIARES ---

function sanitize(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showLoading() {
  tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-gray-500 animate-pulse">Carregando...</td></tr>`;
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `px-6 py-4 rounded-lg shadow-xl text-white transition-all duration-300 
    ${isError ? "bg-red-500" : "bg-green-500"}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-[-10px]");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- FUNÇÕES DA API ---

async function getProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    productsCache = data.sort((a, b) => a.name.localeCompare(b.name));
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
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Falha ao criar produto.");
  return await response.json();
}

async function updateProduct(id, productData) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Falha ao atualizar produto.");
  return await response.json();
}

async function deleteProductApi(id) {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Falha ao excluir produto.");
  return await response.json();
}

// --- RENDERIZAÇÃO ---

function renderTable() {
  if (!productsCache || productsCache.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" class="text-center p-8 text-gray-500">Nenhum produto cadastrado.</td></tr>`;
    return;
  }

  tableBody.innerHTML = "";
  productsCache.forEach((product) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-gray-50";
    tr.innerHTML = `
      <td class="p-4 flex items-center gap-4">
        <img src="${sanitize(product.imagem)}" alt="${sanitize(product.name)}" 
          class="w-16 h-16 object-contain rounded-md bg-gray-200" 
          onerror="this.src='https://placehold.co/64x64/EEE/31343C?text=Imagem'">
        <span class="font-semibold">${sanitize(product.name)}</span>
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

// --- MODAL LÓGICA ---

function openProductModal(product = null) {
  productForm.reset();
  if (product) {
    modalTitle.textContent = "Editar Produto";
    productIdInput.value = product.id;
    productForm.name.value = product.name;
    productForm.price.value = product.price;
    productForm.image.value = product.imagem;
  } else {
    modalTitle.textContent = "Adicionar Novo Produto";
    productIdInput.value = "";
  }
  productModal.classList.remove("hidden");
  productModal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
  productModal.classList.add("hidden");
  productModal.setAttribute("aria-hidden", "true");
}

function openDeleteModal(id) {
  productToDeleteId = id;
  const product = productsCache.find((p) => p.id === id);
  deleteModalText.innerHTML = `Você tem certeza que deseja excluir o produto <strong class="text-black">"${sanitize(
    product.name
  )}"</strong>?`;
  deleteModal.classList.remove("hidden");
  deleteModal.setAttribute("aria-hidden", "false");
}

function closeDeleteModal() {
  deleteModal.classList.add("hidden");
  deleteModal.setAttribute("aria-hidden", "true");
}

// --- HANDLERS ---

async function handleFormSubmit(event) {
  event.preventDefault();
  const id = productIdInput.value;
  const priceValue = parseFloat(productForm.price.value);

  if (isNaN(priceValue)) {
    showToast("Preço inválido.", true);
    return;
  }

  const productData = {
    name: productForm.name.value.trim(),
    price: priceValue,
    imagem: productForm.image.value.trim(),
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
  const target = event.target.closest("button");
  if (!target) return;

  const action = target.dataset.action;
  const id = target.dataset.id;

  if (action === "edit") {
    const product = productsCache.find((p) => p.id === id);
    openProductModal(product);
  } else if (action === "delete") {
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

// --- INICIALIZAÇÃO ---

document.addEventListener("DOMContentLoaded", async () => {
  showLoading();
  await getProducts();
  renderTable();

  // Botões principais
  addProductBtn.addEventListener("click", () => openProductModal());
  tableBody.addEventListener("click", handleTableClick);

  // Modal Produto
  productForm.addEventListener("submit", handleFormSubmit);
  closeModalBtn.addEventListener("click", closeProductModal);
  cancelModalBtn.addEventListener("click", closeProductModal);
  productModal.addEventListener("click", (e) => e.target === productModal && closeProductModal());

  // Modal Exclusão
  confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  deleteModal.addEventListener("click", (e) => e.target === deleteModal && closeDeleteModal());
});
