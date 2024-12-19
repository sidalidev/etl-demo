import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <div>
      <h1>Articles</h1>
      <div className="articles-grid">
        {articles.map(article => (
          <div key={article.id} className="article-card">
            <h2>{article.title}</h2>
            <p>Domain: {article.domain}</p>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              Lire l'article
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)