"""
Generate embeddings from portfolio data JSON.

This script intentionally keeps chunking explicit and simple.
If you add a new section to data-002.json, update chunk_data() for that section.
If users may ask for that section using different words, add aliases in SECTION_SYNONYMS.

Usage:
  python -m venv venv
    .\\venv\\Scripts\\Activate.ps1  (Windows) / source venv/bin/activate (Linux/Mac)
  pip install sentence-transformers
  python generate_embeddings.py

Reads data-002.json and produces embeddings.json
"""

import json
import os
import re
from sentence_transformers import SentenceTransformer

MODEL_NAME = 'all-MiniLM-L6-v2'

SECTION_SYNONYMS = {
    'Summary': ['summary', 'profile', 'about'],
    'Skills': ['skills', 'expertise', 'competencies'],
    'Languages': ['languages', 'spoken languages'],
    'Education': ['education', 'academic background'],
    'Experience': ['experience', 'work history', 'employment'],
    'Projects': ['projects', 'case studies', 'work'],
    'About': ['about website', 'site information'],
    'Interests': ['interests', 'personal interests', 'hobbies']
}

def find_data_file():
    """Use the fixed portfolio data source file."""
    data_file = 'data-002.json'
    if not os.path.exists(data_file):
        raise FileNotFoundError(f'{data_file} not found')
    return data_file

def build_searchable_text(chunk):
    parts = [chunk.get('text', '')]

    section = chunk.get('section')
    if section:
        parts.append(section)
        parts.extend(SECTION_SYNONYMS.get(section, []))

    if chunk.get('project'):
        parts.append(chunk['project'])

    if chunk.get('anchor'):
        parts.append(str(chunk['anchor']).replace('-', ' ').replace('_', ' '))

    seen = set()
    normalized = []
    for part in parts:
        token = str(part).strip()
        if not token:
            continue
        key = token.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(token)

    return '. '.join(normalized)

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

        # Interests / hobbies
        interests = p.get('interests') or p.get('personalInterests') or p.get('hobbies') or []
        for interest in interests:
            if isinstance(interest, str):
                chunks.append({
                    'text': interest,
                    'section': 'Interests',
                    'anchor': 'summary-container'
                })
            elif isinstance(interest, dict):
                title = interest.get('title') or interest.get('name') or interest.get('label') or ''
                description = interest.get('description') or interest.get('text') or ''
                if title or description:
                    chunks.append({
                        'text': f"{title}: {description}" if title and description else (title or description),
                        'section': 'Interests',
                        'anchor': 'summary-container'
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
        company_slug = re.sub(r'[^a-z0-9]+', '-', exp['company'].lower()).strip('-')
        text = f"{exp['title']} at {exp['company']}, {exp['location']} ({exp['period']}). {exp['description']}"
        chunks.append({
            'text': text,
            'section': 'Experience',
            'experience_id': company_slug,
            'anchor': f'experience-{company_slug}'
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
            'project_id': proj['id'],
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
                
                block_anchor = f"{anchor}-{block['id']}"
                chunk = {
                    'text': text,
                    'section': 'Projects',
                    'project': project_name,
                    'project_id': proj['id'],
                    'block_id': block['id'],
                    'anchor': block_anchor
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

    for chunk in chunks:
        chunk['searchable_text'] = build_searchable_text(chunk)
    
    return chunks

def generate_embeddings(chunks, model):
    """Generate embeddings for all chunks."""
    texts = [c['searchable_text'] for c in chunks]
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
