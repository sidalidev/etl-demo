# Demo ETL

Exemple simple d'un pipeline ETL complet.

## Structure

```
etl-demo/
├── data/
│   ├── raw/           # Données brutes (JSON)
│   └── processed/     # Données nettoyées (CSV)
├── 1-extract.js       # Scraping avec Playwright
├── 2-transform.py     # Nettoyage avec Pandas
└── 3-load.py         # Chargement dans Cassandra
```

## Utilisation

1. Extraction :
```bash
node 1-extract.js
```

2. Transformation :
```bash
python 2-transform.py
```

3. Chargement :
```bash
python 3-load.py
```

## Notes

- Le scraping est configuré pour la Fnac
- Les données sont sauvegardées à chaque étape
- Utilise des batch pour Cassandra