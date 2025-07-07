fetch('../assets/portfolio_datas.json')
  .then(response => response.json())
  .then(data => {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    portfolioGrid.innerHTML = ''; // Clear existing content

    data.forEach(item => {
      const article = document.createElement('article');
      article.className = `portfolio-item`;
      article.setAttribute('data-category', item.category);

      article.innerHTML = `
        <figure class="portfolio-image">
          <div class="image-placeholder" aria-label="${item.name} preview">
            <img src="${item.image}" alt="${item.name}" class="img-fluid" loading="lazy">
          </div>
          <figcaption>
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <a href="${item.link}" class="portfolio-link" aria-label="View ${item.name} details">View Project</a>
          </figcaption>
        </figure>
      `;

      portfolioGrid.appendChild(article);
    });
  })
  .catch(error => console.error('Error loading portfolio data:', error));