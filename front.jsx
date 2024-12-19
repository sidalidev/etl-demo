import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles.css'

function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalArticles: 0,
    avgWordCount: 0,
    techArticles: 0,
    categoryBreakdown: {}
  })

  useEffect(() => {
    fetch('http://localhost:3000/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data)
        const stats = {
          totalArticles: data.length,
          avgWordCount: data.reduce((acc, curr) => acc + curr.word_count, 0) / data.length,
          techArticles: data.filter(a => a.is_tech).length,
          categoryBreakdown: data.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1
            return acc
          }, {})
        }
        setStats(stats)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Chargement...</div>

  return (
    <div className="container">
      <header>
        <h1>Dashboard Articles HN</h1>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Articles</h3>
          <p className="stat-number">{stats.totalArticles}</p>
        </div>
        <div className="stat-card">
          <h3>Mots en moyenne</h3>
          <p className="stat-number">{stats.avgWordCount.toFixed(1)}</p>
        </div>
        <div className="stat-card">
          <h3>Articles Tech</h3>
          <p className="stat-number">{stats.techArticles}</p>
        </div>
      </div>

      <div className="categories-section">
        <h2>Répartition par catégorie</h2>
        <div className="category-bars">
          {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
            <div key={category} className="category-bar">
              <div className="bar-label">{category}</div>
              <div
                className="bar"
                style={{
                  width: `${(count / stats.totalArticles) * 100}%`,
                  backgroundColor: getCategoryColor(category)
                }}
              >
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="articles-section">
        <h2>Articles Récents</h2>
        <div className="articles-grid">
          {articles.map(article => (
            <div
              key={article.id}
              className={`article-card ${article.is_tech ? 'tech-article' : ''}`}
            >
              <div className="article-meta">
                <span className={`category-tag ${article.category}`}>
                  {article.category}
                </span>
                <span className="word-count">
                  {article.word_count} mots
                </span>
              </div>
              <h3>{article.title}</h3>
              <p className="domain">{article.domain}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Lire l'article
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getCategoryColor(category) {
  const colors = {
    tech: '#3498db',
    blog: '#2ecc71',
    video: '#e74c3c',
    other: '#95a5a6'
  }
  return colors[category] || colors.other
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)