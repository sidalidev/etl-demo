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

    # Liste étendue de mots-clés tech
    tech_keywords = [
        'python', 'javascript', 'js', 'react', 'node', 'rust', 'golang', 'go',
        'java', 'kubernetes', 'k8s', 'docker', 'aws', 'cloud', 'api',
        'linux', 'git', 'devops', 'sql', 'database', 'ai', 'ml', 'data',
        'server', 'backend', 'frontend', 'fullstack', 'programming', 'code',
        'software', 'web', 'app', 'development', 'security', 'cyber'
    ]

    # Catégorisation des domaines
    domain_categories = {
        'github.com': 'development',
        'github.io': 'development',
        'gitlab.com': 'development',
        'stackoverflow.com': 'programming',
        'aws.amazon.com': 'cloud',
        'cloud.google.com': 'cloud',
        'microsoft.com': 'enterprise',
        'dev.to': 'programming',
        'hashnode.dev': 'programming',
        'medium.com': 'blog',
        'youtube.com': 'video',
        'news.ycombinator.com': 'news',
        'techcrunch.com': 'news',
        'wired.com': 'news'
    }

    # D'abord catégoriser par domaine
    df['category'] = df['domain'].map(domain_categories)

    # Puis vérifier les mots-clés tech dans le titre
    tech_in_title = df['title'].str.contains('|'.join(tech_keywords), case=False)

    # Si un article a des mots-clés tech dans le titre mais pas de catégorie,
    # le mettre en tech_article
    df.loc[tech_in_title & df['category'].isna(), 'category'] = 'tech_article'

    # Remplir le reste avec 'other'
    df['category'] = df['category'].fillna('other')

    # Un article est considéré tech s'il est dans une catégorie technique
    tech_categories = ['development', 'programming', 'cloud', 'tech_article']
    df['is_tech'] = df['category'].isin(tech_categories)

    # Filtrage des articles trop courts
    df = df[df['word_count'] >= 3]

    # Sauvegarde des données transformées
    result = df.to_dict('records')
    with open('transformed_data.json', 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Transformé {len(result)} articles")
    print("\nStatistiques:")
    print(f"Nombre moyen de mots par titre: {df['word_count'].mean():.1f}")
    print(f"Domaines les plus fréquents:\n{df['domain'].value_counts().head()}")
    print(f"Articles tech: {df['is_tech'].sum()} sur {len(df)}")

if __name__ == "__main__":
    transform()