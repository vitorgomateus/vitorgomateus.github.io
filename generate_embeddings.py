"""
Generate embeddings from portfolio data JSON.

Usage:
  python -m venv venv
  .\venv\Scripts\Activate.ps1  (Windows) / source venv/bin/activate (Linux/Mac)
  pip install sentence-transformers
  python generate_embeddings.py

Reads data-002.json and produces embeddings.json
"""

import json
import os
from sentence_transformers import SentenceTransformer

MODEL_NAME = 'all-MiniLM-L6-v2'

def find_data_file():
    """Use the fixed portfolio data source file."""
    data_file = 'data-002.json'
    if not os.path.exists(data_file):
        raise FileNotFoundError(f'{data_file} not found')
    return data_file

def chunk_data(data):
    """Convert portfolio data into text chunks with metadata."""
    chunks = []
    
    # Personal summary
    if 'personal' in data:
        p = data['personal']
        summary_text = f"{p.get('name', '')} - {p.get('title', '')}. {p.get('summary', '')}"
        chunks.append({
            'text': summary_text,
            'section': 'Summary',
            'anchor': 'summary-container'
        })
        
        # Contact info
        contact_parts = []
        if p.get('location'): contact_parts.append(f"Located in {p['location']}")
        if p.get('email'): contact_parts.append(f"Email: {p['email']}")
        if p.get('linkedin'): contact_parts.append(f"LinkedIn: {p['linkedin']}")
        if contact_parts:
            chunks.append({
                'text': f"{p.get('name', '')} contact information. " + '. '.join(contact_parts),
                'section': 'Summary',
                'anchor': 'summary-container'
            })
        
        # Skills
        for skill in p.get('skills', []):
            tools_str = ', '.join(skill.get('tools', []))
            text = f"{skill['category']}: {skill['description']}"
            if tools_str:
                text += f" Tools: {tools_str}"
            chunks.append({
                'text': text,
                'section': 'Skills',
                'anchor': 'skills-container'
            })
        
        # Languages
        if p.get('languages'):
            lang_parts = [f"{k.capitalize()}: {v}" for k, v in p['languages'].items()]
            chunks.append({
                'text': f"Languages spoken: {', '.join(lang_parts)}",
                'section': 'Languages',
                'anchor': 'languages-container'
            })
    
    # Education
    for edu in data.get('education', []):
        text = f"{edu['degree']} at {edu['institution']}, {edu['location']} ({edu['period']})"
        if edu.get('focus'):
            text += f". Focus areas: {edu['focus']}"
        chunks.append({
            'text': text,
            'section': 'Education',
            'anchor': 'education-container'
        })
    
    # Experience
    for exp in data.get('experience', []):
        text = f"{exp['title']} at {exp['company']}, {exp['location']} ({exp['period']}). {exp['description']}"
        chunks.append({
            'text': text,
            'section': 'Experience',
            'anchor': 'experience-container'
        })
    
    # Projects
    for proj in data.get('projects', []):
        project_name = proj['title']
        anchor = f"project-{proj['id']}"
        
        # Overview chunk
        overview_text = f"{project_name}: {proj.get('shortDescription', '')}"
        if proj.get('role'):
            overview_text += f" Role: {proj['role']}."
        if proj.get('company'):
            overview_text += f" Company: {proj['company']}."
        if proj.get('skills'):
            overview_text += f" Skills: {', '.join(proj['skills'])}."
        
        overview_image = None
        for block in proj.get('contentBlocks', []):
            if block.get('id') == 'overview' and block.get('image'):
                overview_image = block['image'].get('src')
                break
        
        chunk = {
            'text': overview_text,
            'section': 'Projects',
            'project': project_name,
            'anchor': anchor
        }
        if overview_image:
            chunk['image'] = overview_image
        chunks.append(chunk)
        
        # Content block chunks
        for block in proj.get('contentBlocks', []):
            if block.get('id') == 'overview':
                continue
            
            if block.get('text'):
                label = f"{project_name}"
                if block.get('heading'):
                    label += f" - {block['heading']}"
                text = f"{label}: {block['text']}"
                
                chunk = {
                    'text': text,
                    'section': 'Projects',
                    'project': project_name,
                    'anchor': anchor
                }
                if block.get('image') and block['image'].get('src'):
                    chunk['image'] = block['image']['src']
                chunks.append(chunk)
    
    # About website
    if 'aboutWebsite' in data:
        aw = data['aboutWebsite']
        text = aw.get('summary', '')
        if aw.get('goals'):
            text += ' Goals: ' + '; '.join(aw['goals'])
        chunks.append({
            'text': text,
            'section': 'About',
            'anchor': 'summary-container'
        })
        
        if aw.get('carbonFootprint'):
            chunks.append({
                'text': f"Carbon footprint: {aw['carbonFootprint']}",
                'section': 'About',
                'anchor': 'summary-container'
            })
    
    return chunks

def generate_embeddings(chunks, model):
    """Generate embeddings for all chunks."""
    texts = [c['text'] for c in chunks]
    print(f'Generating embeddings for {len(texts)} chunks...')
    
    embeddings = model.encode(texts, show_progress_bar=True)
    
    for i, chunk in enumerate(chunks):
        chunk['embedding'] = embeddings[i].tolist()
    
    return chunks

def main():
    # Use fixed data file
    data_file = find_data_file()
    print(f'Using data file: {data_file}')
    
    # Load data
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Chunk data
    chunks = chunk_data(data)
    print(f'Created {len(chunks)} chunks')
    
    # Load model
    print(f'Loading model: {MODEL_NAME}')
    model = SentenceTransformer(MODEL_NAME)
    
    # Generate embeddings
    result = generate_embeddings(chunks, model)
    
    # Save
    output_file = 'embeddings.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f'Saved {len(result)} embeddings to {output_file}')

if __name__ == '__main__':
    main()
