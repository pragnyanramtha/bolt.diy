import { useParams } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import { type ChatHistoryItem } from '~/lib/persistence';
import WithTooltip from '~/components/ui/Tooltip';
import { useEditChatDescription } from '~/lib/hooks';
import { forwardRef, type ForwardedRef, useCallback } from 'react';
import { Checkbox } from '~/components/ui/Checkbox';

interface HistoryItemProps {
  item: ChatHistoryItem;
  onDelete?: (event: React.UIEvent) => void;
}

export function HistoryItem({ item, onDelete }: HistoryItemProps) {
  const { id: urlId } = useParams();
  const isActiveChat = urlId === item.urlId;

  const { editing, handleChange, handleBlur, handleSubmit, handleKeyDown, currentDescription, toggleEditMode } =
    useEditChatDescription({
      initialDescription: item.description,
      customChatId: item.id,
      syncWithGlobalStore: isActiveChat,
    });

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();

      if (onDelete) {
        onDelete(event as unknown as React.UIEvent);
      }
    },
    [onDelete, item.id],
  );

  return (
    <div
      className={classNames(
        'group rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.04] overflow-hidden flex justify-between items-center px-3 py-2 transition-all duration-200',
        {
          'text-gray-900 dark:text-white bg-black/5 dark:bg-white/[0.04] font-medium ring-1 ring-black/5 dark:ring-white/5':
            isActiveChat,
        },
      )}
    >
      {editing ? (
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-black/5 dark:bg-white/5 text-gray-900 dark:text-white rounded-lg px-2.5 py-1 text-sm border border-black/5 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            autoFocus
            value={currentDescription}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </form>
      ) : (
        <a href={`/chat/${item.urlId}`} className="flex w-full relative truncate block items-center gap-2 py-0.5">
          <div
            className={classNames(
              'w-1.5 h-1.5 rounded-full shrink-0',
              isActiveChat ? 'bg-blue-500' : 'bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-600',
            )}
          />
          <WithTooltip tooltip={currentDescription}>
            <span className="truncate pr-12">{currentDescription}</span>
          </WithTooltip>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-gray-100 dark:from-[#111] via-gray-100 dark:via-[#111] to-transparent pl-4">
            <ChatActionButton
              toolTipContent="Rename"
              icon="i-ph:pencil-simple-bold"
              onClick={(event) => {
                event.preventDefault();
                toggleEditMode();
              }}
            />
            <ChatActionButton
              toolTipContent="Delete"
              icon="i-ph:trash-bold"
              className="hover:text-red-500 dark:hover:text-red-400"
              onClick={handleDeleteClick}
            />
          </div>
        </a>
      )}
    </div>
  );
}

const ChatActionButton = forwardRef(
  (
    {
      toolTipContent,
      icon,
      className,
      onClick,
    }: {
      toolTipContent: string;
      icon: string;
      className?: string;
      onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
      btnTitle?: string;
    },
    ref: ForwardedRef<HTMLButtonElement>,
  ) => {
    return (
      <WithTooltip tooltip={toolTipContent} position="bottom" sideOffset={4}>
        <button
          ref={ref}
          type="button"
          className={`text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors ${icon} ${className ? className : ''}`}
          onClick={onClick}
        />
      </WithTooltip>
    );
  },
);
