// Seleciona os elementos HTML onde os produtos serão exibidos e o modal
const allProductListingsContainer = document.getElementById('all-product-listings');
const informaticaListingsContainer = document.getElementById('informatica-product-listings');
const gamesListingsContainer = document.getElementById('games-product-listings');
const eletronicosListingsContainer = document.getElementById('eletronicos-product-listings');
const variadosListingsContainer = document.getElementById('variados-product-listings'); // ADIÇÃO AQUI

const productModal = document.getElementById('product-modal');
const modalDetails = document.getElementById('modal-details');
const closeButton = document.querySelector('.close-button');

// Seleciona o input de pesquisa
const searchInput = document.getElementById('search-input');

// Variável para armazenar todos os produtos carregados inicialmente
let allProducts = [];

// Variável para armazenar o termo de pesquisa atual (para persistir o destaque)
let currentSearchTerm = '';

// --- FUNÇÕES DE LÓGICA DO SITE ---

// Função para carregar os dados dos produtos do arquivo JSON
async function carregarProdutos() {
    try {
        const response = await fetch('./data/produtos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - Caminho: ./data/produtos.json`);
        }
        const produtos = await response.json();
        
        allProducts = produtos;

        // Chama as funções para exibir os produtos em suas respectivas seções
        renderizarTodosOsProdutos(allProducts); // Esta terá rolagem automática
        renderizarProdutosPorCategoria('Informática', informaticaListingsContainer);
        renderizarProdutosPorCategoria('Games', gamesListingsContainer);
        renderizarProdutosPorCategoria('Eletrônicos', eletronicosListingsContainer);
        renderizarProdutosPorCategoria('Variados', variadosListingsContainer); // ADIÇÃO AQUI

    } catch (error) {
        console.error('Erro ao carregar os produtos:', error);
        allProductListingsContainer.innerHTML = '<p style="color: red; text-align: center;">Não foi possível carregar os produtos. Verifique o console para mais detalhes ou se o arquivo produtos.json existe e está correto.</p>';
        informaticaListingsContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar produtos de Informática.</p>';
        gamesListingsContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar produtos de Games.</p>';
        eletronicosListingsContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar produtos Eletrônicos.</p>';
        variadosListingsContainer.innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar produtos Variados.</p>'; // ADIÇÃO AQUI
    }
}

// Função para renderizar TODOS os cartões de produtos na seção "Todos os Produtos"
function renderizarTodosOsProdutos(listaDeProdutos) {
    allProductListingsContainer.innerHTML = ''; // Limpa o conteúdo atual

    if (listaDeProdutos.length === 0) {
        allProductListingsContainer.innerHTML = '<p style="text-align: center; font-size: 1.2em; color: #555;">Nenhum produto encontrado.</p>';
    } else {
        listaDeProdutos.forEach(produto => {
            const card = criarCartaoProduto(produto);
            allProductListingsContainer.appendChild(card);
        });
    }
    // Inicializa o carrossel após renderizar, passando `true` para rolagem automática
    // ALTERAÇÃO AQUI: Passa o .carousel-container (pai do pai)
    inicializarCarrossel(allProductListingsContainer.parentElement.parentElement, true);
    adicionarEventListenersBotoesDetalhes(allProductListingsContainer);
}

// Função para renderizar cartões de produtos filtrados por categoria
function renderizarProdutosPorCategoria(categoria, container) {
    container.innerHTML = ''; // Limpa o conteúdo atual

    const produtosFiltrados = allProducts.filter(produto =>
        produto.categoria && produto.categoria.toLowerCase() === categoria.toLowerCase()
    );

    if (produtosFiltrados.length === 0) {
        container.innerHTML = `<p style="text-align: center; font-size: 1.2em; color: #555;">Nenhum produto na categoria "${categoria}" encontrado.</p>`;
    } else {
        produtosFiltrados.forEach(produto => {
            const card = criarCartaoProduto(produto);
            container.appendChild(card);
        });
    }
    // Inicializa o carrossel após renderizar, passando `false` para não ter rolagem automática
    // ALTERAÇÃO AQUI: Passa o .carousel-container (pai do pai)
    inicializarCarrossel(container.parentElement.parentElement, false);
    adicionarEventListenersBotoesDetalhes(container);
}

// Função auxiliar para criar um cartão de produto
function criarCartaoProduto(produto) {
    const card = document.createElement('div');
    card.classList.add('product-card');

    if (currentSearchTerm &&
        (produto.nomeProduto.toLowerCase().includes(currentSearchTerm) ||
        produto.fabricante.toLowerCase().includes(currentSearchTerm) ||
        produto.categoria.toLowerCase().includes(currentSearchTerm) ||
        produto.descricaoDetalhada.toLowerCase().includes(currentSearchTerm))) {
        card.classList.add('highlight');
    }

    card.innerHTML = `
        <img src="${produto.imagens[0]}" alt="${produto.nomeProduto}">
        <h3>${produto.nomeProduto}</h3>
        <p>Fabricante: ${produto.fabricante}</p>
        <p>Categoria: ${produto.categoria}</p>
        <p class="preco">${produto.preco}</p>
        <button class="btn-ver-detalhes" data-id="${produto.id}">Ver Detalhes</button>
    `;
    return card;
}

// Função auxiliar para adicionar event listeners aos botões "Ver Detalhes"
function adicionarEventListenersBotoesDetalhes(container) {
    container.querySelectorAll('.btn-ver-detalhes').forEach(button => {
        button.addEventListener('click', (event) => {
            const produtoId = parseInt(event.target.dataset.id);
            const produtoSelecionado = allProducts.find(produto => produto.id === produtoId);
            abrirModalProduto(produtoSelecionado);
        });
    });
}

// --- FUNÇÕES DO CARROSSEL ---
function inicializarCarrossel(carouselContainer, enableAutoplay) {
    const carouselWrapper = carouselContainer.querySelector('.carousel-wrapper');
    const prevBtn = carouselContainer.querySelector('.prev-btn');
    const nextBtn = carouselContainer.querySelector('.next-btn');
    const carouselContent = carouselContainer.querySelector('.carousel-content');

    // **IMPORTANTE**: Estes logs ajudarão a depurar se os elementos são encontrados
    if (!carouselWrapper) { console.warn('Elemento .carousel-wrapper não encontrado para:', carouselContainer); return; }
    if (!prevBtn) { console.warn('Elemento .prev-btn não encontrado para:', carouselContainer); return; }
    if (!nextBtn) { console.warn('Elemento .next-btn não encontrado para:', carouselContainer); return; }
    if (!carouselContent) { console.warn('Elemento .carousel-content não encontrado para:', carouselContainer); return; }
    
    const firstCard = carouselContent.querySelector('.product-card');
    let scrollAmount = 0;
    if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const style = window.getComputedStyle(carouselContent);
        const gap = parseFloat(style.getPropertyValue('gap')) || 0;
        scrollAmount = cardWidth + gap;
    } else {
        // Se não há cards, desabilita os botões e não tenta rolar
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
    }

    function atualizarBotoes() {
        prevBtn.disabled = carouselWrapper.scrollLeft === 0;
        const maxScrollLeft = carouselContent.scrollWidth - carouselWrapper.clientWidth;
        nextBtn.disabled = Math.round(carouselWrapper.scrollLeft) >= Math.round(maxScrollLeft) - 5; // Margem para arredondamento

        // Se o conteúdo é menor ou igual ao wrapper, desabilita ambos os botões
        if (carouselContent.scrollWidth <= carouselWrapper.clientWidth + 5) { // Margem para arredondamento
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // ROLAGEM AUTOMÁTICA
    let autoplayInterval;
    const AUTOPLAY_DELAY = 5000; // 5 segundos

    function startAutoplay() {
        if (!enableAutoplay) return;

        stopAutoplay(); // Limpa qualquer intervalo existente antes de iniciar um novo

        autoplayInterval = setInterval(() => {
            // Se o carrossel estiver no final, volta para o início
            if (Math.round(carouselWrapper.scrollLeft) >= Math.round(carouselContent.scrollWidth - carouselWrapper.clientWidth) - 5) {
                carouselWrapper.scrollLeft = 0; // Volta para o início
            } else {
                carouselWrapper.scrollLeft += scrollAmount;
            }
            atualizarBotoes();
        }, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    // Pausa o autoplay ao passar o mouse por cima
    carouselContainer.addEventListener('mouseenter', stopAutoplay);
    // Retoma o autoplay ao tirar o mouse
    carouselContainer.addEventListener('mouseleave', startAutoplay);

    // Pausa o autoplay ao clicar nos botões de navegação
    prevBtn.addEventListener('click', () => {
        stopAutoplay();
        carouselWrapper.scrollLeft -= scrollAmount;
        atualizarBotoes();
        // Reinicia o autoplay após um breve atraso
        clearTimeout(carouselContainer._autoplayResumeTimeout);
        carouselContainer._autoplayResumeTimeout = setTimeout(startAutoplay, 3000); // Reinicia 3s depois
    });

    nextBtn.addEventListener('click', () => {
        stopAutoplay();
        carouselWrapper.scrollLeft += scrollAmount;
        atualizarBotoes();
        // Reinicia o autoplay após um breve atraso
        clearTimeout(carouselContainer._autoplayResumeTimeout);
        carouselContainer._autoplayResumeTimeout = setTimeout(startAutoplay, 3000); // Reinicia 3s depois
    });

    // Também pausa se o usuário arrastar com o mouse (touch)
    carouselWrapper.addEventListener('scroll', () => {
        stopAutoplay();
        // Um pequeno atraso para reiniciar o autoplay após o scroll manual terminar
        clearTimeout(carouselWrapper._scrollTimeout);
        carouselWrapper._scrollTimeout = setTimeout(startAutoplay, 500); // Reinicia 0.5s após parar de rolar
    });

    window.addEventListener('resize', () => {
        const currentFirstCard = carouselContent.querySelector('.product-card');
        if (currentFirstCard) {
            const cardWidth = currentFirstCard.offsetWidth;
            const style = window.getComputedStyle(carouselContent);
            const gap = parseFloat(style.getPropertyValue('gap')) || 0;
            scrollAmount = cardWidth + gap;
        }
        atualizarBotoes();
        // Garante que o scroll não fique em uma posição inválida após resize
        if (carouselWrapper.scrollLeft > carouselContent.scrollWidth - carouselWrapper.clientWidth) {
            carouselWrapper.scrollLeft = carouselContent.scrollWidth - carouselWrapper.clientWidth;
        }
        startAutoplay(); // Reinicia o autoplay para ajustar-se ao novo tamanho
    });

    atualizarBotoes(); // Chama na inicialização para definir o estado inicial dos botões
    startAutoplay(); // Inicia a rolagem automática na inicialização se enableAutoplay for true
}


// Função para abrir o modal com os detalhes de um produto específico
function abrirModalProduto(produto) {
    if (!produto) return;

    modalDetails.innerHTML = '';

    let galleryHtml = '';
    if (produto.imagens && produto.imagens.length > 0) {
        galleryHtml = `
            <div class="modal-gallery">
                <img src="${produto.imagens[0]}" alt="${produto.nomeProduto}" class="main-modal-image">
                <div class="thumbnail-images">
                    ${produto.imagens.map((imgSrc, index) =>
                        `<img src="${imgSrc}" alt="${produto.nomeProduto} ${index + 1}" class="thumbnail" data-index="${index}">`
                    ).join('')}
                </div>
            </div>
        `;
    }

    modalDetails.innerHTML = `
        ${galleryHtml}
        <div class="modal-details-text">
            <h2>${produto.nomeProduto}</h2>
            <p class="modal-preco">Preço: ${produto.preco}</p>
            <p><strong>Fabricante:</strong> ${produto.fabricante}</p>
            <p><strong>Categoria:</strong> ${produto.categoria}</p>
            <p><strong>Descrição:</strong> ${produto.descricaoDetalhada}</p>
            <div class="modal-buttons">
                <a href="${produto.linkAfiliado}" target="_blank" class="btn-comprar">
                    <i class="fas fa-shopping-cart"></i> Ver Oferta no Site do Parceiro
                </a>
            </div>
        </div>
    `;

    if (produto.imagens && produto.imagens.length > 1) {
        const mainModalImage = modalDetails.querySelector('.main-modal-image');
        const firstThumbnail = modalDetails.querySelector('.thumbnail[data-index="0"]');
        if (firstThumbnail) {
            firstThumbnail.classList.add('active');
        }

        modalDetails.querySelectorAll('.thumbnail').forEach(thumbnail => {
            thumbnail.addEventListener('click', (event) => {
                mainModalImage.src = event.target.src;
                modalDetails.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                event.target.classList.add('active');
            });
        });
    }

    productModal.style.display = 'flex'; // Usar flex para centralizar
    document.body.style.overflow = 'hidden';
}

// Função para fechar o modal
function fecharModalProduto() {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Função para filtrar os produtos com base na pesquisa
function filtrarProdutos() {
    currentSearchTerm = searchInput.value.toLowerCase().trim();

    // Se o campo de pesquisa estiver vazio, renderiza todos os produtos e as categorias normalmente
    if (currentSearchTerm === '') {
        carregarProdutos(); // Recarrega todas as seções, o que inicializa os carrosséis
        return;
    }

    const filteredProducts = allProducts.filter(produto => {
        const nome = produto.nomeProduto.toLowerCase();
        const fabricante = produto.fabricante.toLowerCase();
        const categoria = produto.categoria.toLowerCase();
        const descricao = produto.descricaoDetalhada.toLowerCase();

        return nome.includes(currentSearchTerm) ||
                fabricante.includes(currentSearchTerm) ||
                categoria.includes(currentSearchTerm) ||
                descricao.includes(currentSearchTerm);
    });

    // Limpa todas as seções antes de renderizar os resultados da busca
    allProductListingsContainer.innerHTML = '';
    informaticaListingsContainer.innerHTML = ''; // Limpa as categorias para mostrar apenas o resultado da busca
    gamesListingsContainer.innerHTML = '';
    eletronicosListingsContainer.innerHTML = '';
    variadosListingsContainer.innerHTML = ''; // ADIÇÃO AQUI


    // Renderiza APENAS a seção "Todos os Produtos" com os resultados da busca
    if (filteredProducts.length === 0) {
        allProductListingsContainer.innerHTML = '<p style="text-align: center; font-size: 1.2em; color: #555;">Nenhum produto encontrado para sua pesquisa.</p>';
    } else {
        filteredProducts.forEach(produto => {
            const card = criarCartaoProduto(produto);
            allProductListingsContainer.appendChild(card);
        });
        adicionarEventListenersBotoesDetalhes(allProductListingsContainer);
    }
    // Inicializa o carrossel da seção de busca (Todos os Produtos) com autoplay desabilitado
    // ALTERAÇÃO AQUI: Passa o .carousel-container (pai do pai)
    inicializarCarrossel(allProductListingsContainer.parentElement.parentElement, false);

    // Rola a tela para a seção "Todos os Produtos" para exibir o resultado da busca
    document.getElementById('todos-produtos').scrollIntoView({ behavior: 'smooth' });
}

// --- EVENT LISTENERS GLOBAIS ---

closeButton.addEventListener('click', fecharModalProduto);

window.addEventListener('click', (event) => {
    if (event.target === productModal) {
        fecharModalProduto();
    }
});

// Event listener para o input de pesquisa
searchInput.addEventListener('input', filtrarProdutos);

// Event listener para o botão de pesquisa (opcional, já que o input já dispara no 'input')
document.getElementById('search-button').addEventListener('click', filtrarProdutos);

// Event listeners para os links de navegação para rolar suavemente e recarregar produtos
document.querySelectorAll('header nav ul li a').forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault(); // Impede o comportamento padrão do link

        searchInput.value = ''; // Limpa a barra de pesquisa
        currentSearchTerm = ''; // Reseta o termo de pesquisa
        carregarProdutos(); // Isso recarrega todas as seções e reinicia os carrosséis/autoplay.

        const targetId = event.target.getAttribute('href').substring(1);
        // Pequeno delay para garantir que a renderização ocorra antes do scroll
        setTimeout(() => {
            document.getElementById(targetId).scrollIntoView({ behavior: 'smooth' });
        }, 100);
    });
});



// --- INICIALIZAÇÃO ---

// Carrega os produtos quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', carregarProdutos);