# Création d'un Pipeline ETL avec Node.js, Python et Cassandra

Ce tutoriel explique comment j'ai créé un pipeline ETL (Extract, Transform, Load) pour analyser les articles de HackerNews.

## 1. Extraction des données (Extract)

J'ai utilisé Playwright pour scraper HackerNews car il gère bien le JavaScript moderne :

```javascript
// scraper.js
const { chromium } = require('playwright');
const fs = require('fs').promises;

async function scrape() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('https://news.ycombinator.com');

  const articles = await page.evaluate(() => {
    const items = document.querySelectorAll('.athing');
    return Array.from(items).map(item => ({
      id: item.getAttribute('id'),
      title: item.querySelector('.titleline a').innerText,
      url: item.querySelector('.titleline a').href
    }));
  });

  await fs.writeFile('raw_data.json', JSON.stringify(articles, null, 2));
}
```

## 2. Transformation des données (Transform)

Pour la transformation, j'utilise pandas qui est parfait pour manipuler et analyser les données :

```python
# transform.py
import pandas as pd
from urllib.parse import urlparse

def transform():
    # Lecture et conversion en DataFrame
    df = pd.DataFrame(raw_data)

    # Enrichissement
    df['title'] = df['title'].str.lower()
    df['domain'] = df['url'].apply(lambda x: urlparse(x).netloc)
    df['word_count'] = df['title'].str.split().str.len()

    # Catégorisation intelligente
    domain_categories = {
        'github.com': 'development',
        'stackoverflow.com': 'programming',
        'aws.amazon.com': 'cloud',
        'medium.com': 'blog',
        'youtube.com': 'video'
    }
    df['category'] = df['domain'].map(domain_categories).fillna('other')

    # Détection tech avec mots-clés
    tech_keywords = [
        'python', 'javascript', 'react', 'node', 'aws',
        'cloud', 'api', 'docker', 'kubernetes'
    ]
    df['is_tech'] = df['title'].str.contains('|'.join(tech_keywords))
```

## 3. Stockage des données (Load)

Cassandra est une base de données NoSQL orientée colonnes, parfaite pour notre ETL :

### Structure Cassandra
```
Keyspace (≈ Database)
   └── Table (≈ Column Family)
       └── Row
           └── Column
               ├── Name
               ├── Value
               └── Timestamp
```

### Pourquoi Cassandra ?
- Optimisé pour l'écriture (parfait pour ETL)
- Scalable horizontalement (scale out)
- Pas de JOINS (on dénormalise à l'écriture)
- Idéal pour les données temporelles

### Scaling Horizontal vs Vertical
```
Scaling Vertical (Scale Up) :
┌────────────────┐
│ Grosse Machine │ <- Ajouter RAM/CPU à une seule machine
└────────────────┘

Scaling Horizontal (Scale Out) :
┌────────┐ ┌────────┐ ┌────────┐
│Machine1│ │Machine2│ │Machine3│ <- Ajouter plus de machines
└────────┘ └────────┘ └────────┘
```

- **Vertical** : Augmenter la puissance d'une machine (plus de RAM, meilleur CPU)
- **Horizontal** : Ajouter plus de machines au cluster

Cassandra est conçu pour le scaling horizontal :
- Les données sont automatiquement distribuées
- Pas de point unique de défaillance
- Parfait pour gérer de gros volumes de données

### Notre modèle de données
```sql
-- Keyspace pour notre application
CREATE KEYSPACE etl_data
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

-- Table principale
CREATE TABLE articles (
    id text PRIMARY KEY,  -- Clé de partitionnement
    title text,          -- Colonne standard
    url text,
    domain text,
    word_count int,
    category text,
    is_tech boolean,
    processed_at timestamp
);
```

```javascript
// server.js
const express = require('express');
const { Client } = require('cassandra-driver');

const client = new Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1'
});

// Création du schéma
await client.execute(`
  CREATE TABLE IF NOT EXISTS articles (
    id text PRIMARY KEY,
    title text,
    url text,
    domain text,
    word_count int,
    category text,
    is_tech boolean
  )
`);

// API pour récupérer les données
app.get('/articles', async (req, res) => {
  const result = await client.execute('SELECT * FROM articles');
  res.json(result.rows);
});
```

## 4. Visualisation avec React

Le frontend utilise React avec des hooks pour une UI réactive :

```jsx
// front.jsx
function App() {
  const [articles, setArticles] = useState([])
  const [stats, setStats] = useState({
    totalArticles: 0,
    avgWordCount: 0,
    techArticles: 0,
    categoryBreakdown: {}
  })

  useEffect(() => {
    fetch('/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data)
        // Calcul des stats
        setStats({
          totalArticles: data.length,
          avgWordCount: data.reduce((acc, curr) => acc + curr.word_count, 0) / data.length,
          techArticles: data.filter(a => a.is_tech).length,
          categoryBreakdown: data.reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + 1
            return acc
          }, {})
        })
      })
  }, [])
}
```

## 5. Automatisation

Le pipeline s'exécute toutes les minutes :

```javascript
// server.js
const cron = require('node-cron');

cron.schedule('* * * * *', async () => {
  await scrape();           // Extract
  await execAsync('python transform.py');  // Transform
  await loadData();         // Load
});
```

## Points clés appris

1. **Architecture ETL** : La séparation en trois étapes rend le code plus maintenable
2. **Pandas > JSON** : Pandas simplifie énormément les transformations de données
3. **React moderne** : Les hooks rendent le code plus lisible
4. **NoSQL** : Cassandra est excellent pour les écritures fréquentes

## Installation et lancement

```bash
# Installation des dépendances
npm install
pip install -r requirements.txt

# Démarrage de Cassandra (avec brew)
brew services start cassandra

# Dans un premier terminal (backend)
node server.js

# Dans un second terminal (frontend)
npm run front
```

## Structure des fichiers

```
.
├── scraper.js          # Extraction (Playwright)
├── transform.py        # Transformation (Pandas)
├── server.js          # API + Cassandra
├── front.jsx          # Interface React
├── styles.css         # Styles
└── package.json       # Dépendances
```

## Prochaines améliorations possibles

1. Ajouter Kafka pour du vrai temps réel
2. Utiliser TypeScript
3. Ajouter des tests
4. Dockeriser l'application
5. Ajouter plus de visualisations (graphiques, etc.)

Le dashboard est accessible sur http://localhost:5173