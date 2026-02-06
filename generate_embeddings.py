"""
Generate embeddings from data-002.json for RAG system
Requires: pip install sentence-transformers

Output schema matches REQUIREMENTS.md:
[
  {
    "text": "...",
    "embedding": [...384 dimensions],
    "section": "Skills|Experience|Education|Projects",
    "project": "project-title" (optional),
    "anchor": "element-id" (optional),
    "image": "path/to/image.png" (optional)
  }
]
"""

import json
from sentence_transformers import SentenceTransformer

def load_data():
    """Load data-002.json"""
    with open('data-002.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_chunks(data):
    """
    Extract text chunks from data following REQUIREMENTS.md schema.
    Each chunk = {text, section, project?, anchor?, image?}
    """
    chunks = []
    
    # Personal summary
    if 'personal' in data:
        personal = data['personal']
        
        # Summary chunk
        if 'summary' in personal:
            chunks.append({
                'text': f"{personal.get('name', '')} - {personal.get('title', '')}. {personal['summary']}",
                'section': 'Summary',
                'anchor': 'summary-container'
            })
        
        # Skills - one chunk per category
        if 'skills' in personal:
            for skill in personal['skills']:
                chunks.append({
                    'text': f"{skill['category']}: {skill['description']} Tools: {', '.join(skill.get('tools', []))}",
                    'section': 'Skills',
                    'anchor': 'skills-container'
                })
        
        # Contact info
        if 'email' in personal or 'phone' in personal:
            contact_parts = []
            if 'email' in personal:
                contact_parts.append(f"Email: {personal['email']}")
            if 'phone' in personal:
                contact_parts.append(f"Phone: {personal['phone']}")
            if 'location' in personal:
                contact_parts.append(f"Location: {personal['location']}")
            if 'linkedin' in personal:
                contact_parts.append(f"LinkedIn: {personal['linkedin']}")
            
            chunks.append({
                'text': f"Contact information for Vítor Gonçalves: {', '.join(contact_parts)}",
                'section': 'Summary',
                'anchor': 'summary-container'
            })
    
    # Languages
    if 'personal' in data and 'languages' in data['personal']:
        langs = data['personal']['languages']
        lang_text = f"Languages: English ({langs.get('english', '')}), Portuguese ({langs.get('portuguese', '')}), Spanish ({langs.get('spanish', '')})"
        chunks.append({
            'text': lang_text,
            'section': 'Languages',
            'anchor': 'languages-container'
        })
    
    # Education
    if 'education' in data:
        for edu in data['education']:
            text = f"{edu['degree']} from {edu['institution']}, {edu.get('location', '')} ({edu.get('period', '')})"
            if 'focus' in edu:
                text += f". Focus areas: {edu['focus']}"
            
            chunks.append({
                'text': text,
                'section': 'Education',
                'anchor': 'education-container'
            })
    
    # Experience
    if 'experience' in data:
        for exp in data['experience']:
            text = f"{exp['title']} at {exp['company']}, {exp.get('location', '')} ({exp.get('period', '')}). {exp['description']}"
            
            chunks.append({
                'text': text,
                'section': 'Experience',
                'anchor': 'experience-container'
            })
    
    # Projects - multiple chunks per project
    if 'projects' in data:
        for project in data['projects']:
            if not project.get('active', True):
                continue
            
            project_id = project.get('id', '')
            project_title = project['title']
            
            # Overview chunk
            overview_text = f"{project_title}: {project.get('subtitle', '')}. {project['shortDescription']}"
            if 'skills' in project and project['skills']:
                overview_text += f" Technologies: {', '.join(project['skills'])}"
            if 'role' in project:
                overview_text += f" Role: {project['role']}"
            if 'year' in project:
                overview_text += f" Year: {project['year']}"
            
            chunk = {
                'text': overview_text,
                'section': 'Projects',
                'project': project_title,
                'anchor': f'project-{project_id}'
            }
            
            chunks.append(chunk)
            
            # Content blocks - each becomes a separate chunk
            if 'contentBlocks' in project:
                for block in project['contentBlocks']:
                    if 'text' in block and block['text']:
                        block_text = block['text']
                        if 'heading' in block and block['heading']:
                            block_text = f"{block['heading']}: {block_text}"
                        
                        block_chunk = {
                            'text': f"{project_title} - {block_text}",
                            'section': 'Projects',
                            'project': project_title,
                            'anchor': f'project-{project_id}'
                        }
                        
                        # Add image if available
                        if 'image' in block and block['image'] and 'src' in block['image']:
                            block_chunk['image'] = block['image']['src']
                        
                        chunks.append(block_chunk)
    
    # About website
    if 'aboutWebsite' in data:
        about = data['aboutWebsite']
        
        # Goals
        if 'goals' in about:
            goals_text = f"Website goals: {', '.join(about['goals']) if isinstance(about['goals'], list) else about['goals']}"
            chunks.append({
                'text': goals_text,
                'section': 'About'
            })
        
        # Technical details
        if 'technicalDetails' in about:
            tech_text = f"Technical implementation: {', '.join(about['technicalDetails']) if isinstance(about['technicalDetails'], list) else about['technicalDetails']}"
            chunks.append({
                'text': tech_text,
                'section': 'About'
            })
        
        # Restrictions
        if 'restrictions' in about:
            restrictions_text = f"Design constraints: {', '.join(about['restrictions']) if isinstance(about['restrictions'], list) else about['restrictions']}"
            chunks.append({
                'text': restrictions_text,
                'section': 'About'
            })
    
    return chunks

def generate_embeddings(chunks, model_name='all-MiniLM-L6-v2'):
    """Generate embeddings using sentence-transformers (384 dimensions)"""
    print(f"Loading model: {model_name}...")
    model = SentenceTransformer(model_name)
    
    print(f"Generating embeddings for {len(chunks)} chunks...")
    texts = [chunk['text'] for chunk in chunks]
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    
    # Add embeddings to chunks (as arrays matching REQUIREMENTS.md schema)
    for i, chunk in enumerate(chunks):
        chunk['embedding'] = embeddings[i].tolist()
    
    return chunks

def save_embeddings(chunks, output_file='embeddings.json'):
    """
    Save embeddings to JSON file.
    Output is a simple array matching REQUIREMENTS.md schema.
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(chunks, f, indent=2)
    
    print(f"\n✓ Saved {len(chunks)} embeddings to {output_file}")
    print(f"✓ Embedding dimension: {len(chunks[0]['embedding']) if chunks else 0}")
    
    # Print statistics
    sections = {}
    projects = set()
    images = 0
    
    for chunk in chunks:
        section = chunk.get('section', 'Unknown')
        sections[section] = sections.get(section, 0) + 1
        
        if 'project' in chunk:
            projects.add(chunk['project'])
        
        if 'image' in chunk:
            images += 1
    
    print("\nChunks by section:")
    for section, count in sorted(sections.items()):
        print(f"  {section}: {count}")
    
    print(f"\nProjects covered: {len(projects)}")
    print(f"Chunks with images: {images}")

def main():
    print("=== Embedding Generator for RAG System ===\n")
    
    # Load data
    print("Loading data-002.json...")
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
