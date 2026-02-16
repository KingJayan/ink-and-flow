import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Document } from '../../types';
import { FileText } from 'lucide-react';

interface MentionListProps {
  items: Document[];
  command: (props: { id: string; label: string }) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.title || 'Untitled Draft' });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#252530] border border-wash-stone/30 dark:border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[200px] flex flex-col p-1 animate-fade-in z-50">
      <div className="text-[10px] uppercase font-bold text-ink-faint dark:text-white/30 px-2 py-1 tracking-wider">Link to Document</div>
      {props.items.map((item, index) => (
        <button
          key={item.id}
          className={`
            flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors w-full
            ${index === selectedIndex ? 'bg-wash-stone/20 dark:bg-white/10 text-navy dark:text-blue-400 font-medium' : 'text-ink dark:text-white/70 hover:bg-wash-stone/10 dark:hover:bg-white/5'}
          `}
          onClick={() => selectItem(index)}
        >
          <FileText size={14} className={index === selectedIndex ? 'text-navy dark:text-blue-400' : 'text-ink-faint dark:text-white/20'} />
          <span className="truncate">{item.title || 'Untitled Draft'}</span>
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';