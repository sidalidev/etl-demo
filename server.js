const express = require('express')
const cors = require('cors')
const { Client } = require('cassandra-driver')
const fs = require('fs').promises

const app = express()
app.use(express.json())
app.use(cors())

// Configuration Cassandra sans keyspace initial
const client = new Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
})

// Création du schéma
async function setupDatabase() {
  try {
    // Création du keyspace
    await client.execute(`
      CREATE KEYSPACE IF NOT EXISTS etl_data
      WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
    `)

    // Connexion au keyspace
    await client.execute('USE etl_data')

    // Création de la table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id text PRIMARY KEY,
        title text,
        url text,
        domain text,
        processed_at timestamp
      )
    `)

    console.log('Base de données initialisée avec succès')
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de la base de données:",
      error
    )
    throw error
  }
}

// Chargement des données
async function loadData() {
  try {
    const data = JSON.parse(await fs.readFile('transformed_data.json', 'utf8'))

    const query =
      'INSERT INTO articles (id, title, url, domain, processed_at) VALUES (?, ?, ?, ?, ?)'

    for (const item of data) {
      await client.execute(
        query,
        [
          item.id,
          item.title,
          item.url,
          item.domain,
          new Date(item.processed_at),
        ],
        { prepare: true }
      )
    }
    console.log('Données chargées avec succès')
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    throw error
  }
}

// Routes API
app.get('/articles', async (req, res) => {
  try {
    const result = await client.execute('SELECT * FROM articles')
    res.json(result.rows)
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Initialisation
async function init() {
  try {
    await client.connect()
    console.log('Connecté à Cassandra')

    await setupDatabase()
    await loadData()

    app.listen(3000, () => {
      console.log('Serveur démarré sur http://localhost:3000')
    })
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error)
    process.exit(1)
  }
}

init()
