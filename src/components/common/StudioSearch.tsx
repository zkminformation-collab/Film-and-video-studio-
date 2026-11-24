import React, { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { StudioModule } from '../../types';
import { studioNavigationTools } from './Sidebar';

const searchAliases: Partial<Record<StudioModule, string>> = {
  cartoon_creator: 'anime animation cartoon film',
  ai_wizard: 'movie script to video screenplay',
  ai_voice: 'text to speech narration Kannada',
  editor: 'timeline video editing',
  vfx: 'visual effects shader',
  audio: 'sound effects sfx music mixing',
  export: 'download render mp4 publishing',
  credit_wallet: 'billing plans payment razorpay subscription',
  media: 'library files assets',
  films: 'film production projects',
};

interface StudioSearchProps {
  onClose: () => void;
  onSelect: (module: StudioModule) => void;
}

export function StudioSearch({ onClose, onSelect }: StudioSearchProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const results = studioNavigationTools
    .filter((tool) => {
      const description = `${tool.label} ${searchAliases[tool.id] ?? ''}`.toLowerCase();
      return terms.every((term) => description.includes(term));
    })
    .sort((first, second) =>
      Number(second.label.toLowerCase().startsWith(query.trim().toLowerCase())) -
      Number(first.label.toLowerCase().startsWith(query.trim().toLowerCase()))
    );

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  function choose(module: StudioModule) {
    onClose();
    onSelect(module);
  }

  return (
    <dialog
      ref={dialog}
      className="studio-search-dialog"
      aria-labelledby="studio-search-heading"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div>
        <h2 id="studio-search-heading" className="sr-only">Find a studio tool</h2>
        <form className="studio-search-field" onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) choose(results[0].id);
        }}>
          <Search size={20} />
          <input aria-label="Search studio tools" placeholder="Search studio tools…" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} />
          <button type="button" aria-label="Close search" onClick={onClose}><X size={19} /></button>
        </form>
        <div className="studio-search-results">
          {results.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} onClick={() => choose(id)}><Icon size={18} /> {label}</button>
          ))}
          {results.length === 0 && <p role="status">No tools match your search.</p>}
        </div>
      </div>
    </dialog>
  );
}
