const searchInput = (value) => {
    if (value !== '') {
        axios.get('/api/search', {
            params: {
                query: value
            }
        })
        .then(response => {
            const searchResults = response.data;
            const resultsContainer = document.getElementById('list-group');
            resultsContainer.innerHTML = '<h5 class="text-center">Search Results</h5>'; // Clear previous results

            // Check if there are any results
            if (searchResults.length > 0) {
                searchResults.forEach(result => {
                    const resultHTML = `
                        <div class="list-group-item bg-light">
                            <h5><a href=${result.url}>${result.title}</a></h5>
                            <p>${result.url}</p>
                        </div>
                    `;
                    resultsContainer.innerHTML += resultHTML;
                });
            } else {
                resultsContainer.innerHTML = '<div class="list-group-item">No results found.</div>';
            }
        })
        .catch(error => {
            console.error(error);
            document.getElementById('list-group').innerHTML = '<div class="list-group-item text-danger">Error fetching results.</div>';
        });
    } else {
        document.getElementById('list-group').innerHTML = '';
    }
};
