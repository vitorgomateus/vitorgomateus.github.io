"""
Generate embeddings from data.json for RAG system
Requires: pip install sentence-transformers
"""

import json
from sentence_transformers import SentenceTransformer
import numpy as np

def load_data():
    """Load data.json"""
    with open('data.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_chunks(data):
    """Extract meaningful text chunks from data"""
    chunks = []
    
    # Personal summary
    if 'personal' in data:
        personal = data['personal']
        if 'summary' in personal:
            chunks.append({
                'type': 'summary',
                'content': personal['summary'],
                'metadata': {'name': personal.get('name', ''), 'title': personal.get('title', '')}
            })
        
        # Skills
        if 'skills' in personal:
            for skill in personal['skills']:
                content = f"{skill['category']}: {skill['description']} Tools: {', '.join(skill.get('tools', []))}"
                chunks.append({
                    'type': 'skill',
                    'content': content,
                    'metadata': {'category': skill['category']}
                })
        
        # Contact info
        contact_info = f"Contact: {personal.get('email', '')}, {personal.get('phone', '')}, {personal.get('location', '')}"
        chunks.append({
            'type': 'contact',
            'content': contact_info,
            'metadata': {}
        })
    
    # Education
    if 'education' in data:
        for edu in data['education']:
            content = f"{edu['degree']} from {edu['institution']} ({edu.get('period', '')})"
            if 'focus' in edu:
                content += f". Focus: {edu['focus']}"
            chunks.append({
                'type': 'education',
                'content': content,
                'metadata': {'institution': edu['institution'], 'degree': edu['degree']}
            })
    
    # Experience
    if 'experience' in data:
        for exp in data['experience']:
            content = f"{exp['title']} at {exp['company']} ({exp.get('period', '')}). {exp['description']}"
            chunks.append({
                'type': 'experience',
                'content': content,
                'metadata': {
                    'company': exp['company'],
                    'title': exp['title'],
                    'companyUrl': exp.get('companyUrl', '')
                }
            })
    
    # Projects
    if 'projects' in data:
        for project in data['projects']:
            if not project.get('active', True):
                continue  # Skip inactive projects
            
            content = f"{project['title']}: {project['subtitle']}. {project['shortDescription']}. {project['fullDescription']}"
            if 'skills' in project:
                content += f" Technologies: {', '.join(project['skills'])}"
            
            chunks.append({
                'type': 'project',
                'content': content,
                'metadata': {
                    'title': project['title'],
                    'company': project.get('company', ''),
                    'year': project.get('year', ''),
                    'skills': project.get('skills', [])
                }
            })
    
    # About website
    if 'aboutWebsite' in data:
        about = data['aboutWebsite']
        content = f"About this website: Goals: {about.get('goals', '')}. Technical details: {about.get('technicalDetails', '')}. Restrictions: {about.get('restrictions', '')}. What was learned: {about.get('learned', '')}."
        chunks.append({
            'type': 'website',
            'content': content,
            'metadata': {}
        })
    
    return chunks

def generate_embeddings(chunks, model_name='all-MiniLM-L6-v2'):
    """Generate embeddings using sentence-transformers"""
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)
    
    print(f"Generating embeddings for {len(chunks)} chunks...")
    texts = [chunk['content'] for chunk in chunks]
    embeddings = model.encode(texts, show_progress_bar=True)
    
    # Add embeddings to chunks
    for i, chunk in enumerate(chunks):
        chunk['embedding'] = embeddings[i].tolist()
    
    return chunks

def save_embeddings(chunks, output_file='embeddings.json'):
    """Save embeddings to JSON file"""
    output = {
        'model': 'all-MiniLM-L6-v2',
        'dimension': len(chunks[0]['embedding']) if chunks else 0,
        'chunks': chunks
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
    
    print(f"\nSaved {len(chunks)} embeddings to {output_file}")
    print(f"Embedding dimension: {output['dimension']}")
    
    # Print stats
    types = {}
    for chunk in chunks:
        chunk_type = chunk['type']
        types[chunk_type] = types.get(chunk_type, 0) + 1
    
    print("\nChunks by type:")
    for chunk_type, count in types.items():
        print(f"  {chunk_type}: {count}")

def main():
    print("=== Embedding Generator for RAG System ===\n")
    
    # Load data
    print("Loading data.json...")
    data = load_data()
    
    # Extract chunks
    print("Extracting text chunks...")
    chunks = extract_chunks(data)
    print(f"Extracted {len(chunks)} chunks\n")
    
    # Generate embeddings
    embeddings_data = generate_embeddings(chunks)
    
    # Save to file
    save_embeddings(embeddings_data)
    
    print("\n✓ Done! You can now use embeddings.json in your RAG system.")

if __name__ == '__main__':
    main()
