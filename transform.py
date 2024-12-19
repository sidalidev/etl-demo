import json
from datetime import datetime

def transform():
    # Lecture des données brutes
    with open('raw_data.json', 'r') as f:
        raw_data = json.load(f)

    # Transformation
    transformed_data = []
    for item in raw_data:
        transformed_item = {
            'id': item['id'],
            'title': item['title'].lower(),  # Conversion en minuscules
            'url': item['url'],
            'domain': extract_domain(item['url']),
            'processed_at': datetime.now().isoformat()
        }
        transformed_data.append(transformed_item)

    # Sauvegarde des données transformées
    with open('transformed_data.json', 'w') as f:
        json.dump(transformed_data, f, indent=2)

def extract_domain(url):
    from urllib.parse import urlparse
    return urlparse(url).netloc

if __name__ == "__main__":
    transform()