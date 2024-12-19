import json
import pandas as pd
from datetime import datetime
from urllib.parse import urlparse

def transform():
    # Lecture des données brutes
    with open('raw_data.json', 'r') as f:
        raw_data = json.load(f)

    # Conversion en DataFrame
    df = pd.DataFrame(raw_data)

    # Transformations
    df['title'] = df['title'].str.lower()
    df['domain'] = df['url'].apply(lambda x: urlparse(x).netloc)
    df['word_count'] = df['title'].str.split().str.len()
    df['processed_at'] = datetime.now().isoformat()

    # Ajout de statistiques
    df['title_length'] = df['title'].str.len()

    # Catégorisation des domaines
    domain_categories = {
        'github.com': 'tech',
        'medium.com': 'blog',
        'youtube.com': 'video',
    }
    df['category'] = df['domain'].map(domain_categories).fillna('other')

    # Filtrage des articles trop courts
    df = df[df['word_count'] >= 3]

    # Ajout de métriques
    df['is_tech'] = df['title'].str.contains('|'.join(['python', 'javascript', 'react', 'node']), case=False)

    # Sauvegarde des données transformées
    result = df.to_dict('records')
    with open('transformed_data.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Transformé {len(result)} articles")
    print("\nStatistiques:")
    print(f"Nombre moyen de mots par titre: {df['word_count'].mean():.1f}")
    print(f"Domaines les plus fréquents:\n{df['domain'].value_counts().head()}")

if __name__ == "__main__":
    transform()