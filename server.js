const express = require('express')
const cors = require('cors')
const { Client } = require('cassandra-driver')
const fs = require('fs').promises
const cron = require('node-cron')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

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

    // Suppression de la table si elle existe
    await client.execute('DROP TABLE IF EXISTS articles')

    // Création de la table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id text PRIMARY KEY,
        title text,
        url text,
        domain text,
        word_count int,
        title_length int,
        category text,
        is_tech boolean,
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
      'INSERT INTO articles (id, title, url, domain, word_count, title_length, category, is_tech, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'

    for (const item of data) {
      await client.execute(
        query,
        [
          item.id,
          item.title,
          item.url,
          item.domain,
          item.word_count,
          item.title_length,
          item.category,
          item.is_tech,
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

// Pipeline ETL complet
async function runETLPipeline() {
  try {
    console.log('Démarrage du pipeline ETL...')

    // Extraction
    console.log('1. Extraction...')
    await execAsync('npm run scrape')

    // Transformation
    console.log('2. Transformation...')
    await execAsync('python transform.py')

    // Chargement
    console.log('3. Chargement...')
    await loadData()

    console.log('Pipeline ETL terminé avec succès!')
  } catch (error) {
    console.error('Erreur dans le pipeline ETL:', error)
  }
}

// Initialisation avec CRON
async function init() {
  try {
    await client.connect()
    console.log('Connecté à Cassandra')

    await setupDatabase()

    // Premier run du pipeline
    await runETLPipeline()

    // Configuration du CRON pour exécuter le pipeline toutes les heures
    cron.schedule('* * * * *', () => {
      console.log('Exécution programmée du pipeline ETL')
      runETLPipeline()
    })

    app.listen(3000, () => {
      console.log('Serveur démarré sur http://localhost:3000')
      console.log('Le pipeline ETL s\'exécutera toutes les minutes')
    })
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error)
    process.exit(1)
  }
}

init()
