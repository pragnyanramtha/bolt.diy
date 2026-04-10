import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { SettingsButton } from '~/components/ui/SettingsButton';
import { db, deleteById, getAll, chatId, type ChatHistoryItem } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { HistoryItem } from './HistoryItem';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';

const menuVariants = {
  closed: {
    opacity: 0,
    x: '-100%',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent =
  | { type: 'delete'; item: ChatHistoryItem }
  | { type: 'bulkDelete'; items: ChatHistoryItem[] }
  | null;

export const Menu = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profile = useStore(profileStore);

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteChat = useCallback(
    async (id: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not available');
      }

      try {
        const snapshotKey = `snapshot:${id}`;
        localStorage.removeItem(snapshotKey);
      } catch (snapshotError) {
        console.error(`Error deleting snapshot for chat ${id}:`, snapshotError);
      }

      await deleteById(db, id);
    },
    [db],
  );

  const deleteItem = useCallback(
    (event: React.UIEvent, item: ChatHistoryItem) => {
      event.preventDefault();
      event.stopPropagation();

      deleteChat(item.id)
        .then(() => {
          toast.success('Chat deleted successfully');
          loadEntries();

          if (chatId.get() === item.id) {
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          console.error('Failed to delete chat:', error);
          toast.error('Failed to delete conversation');
        });
    },
    [loadEntries, deleteChat],
  );

  const closeDialog = () => {
    setDialogContent(null);
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open, loadEntries]);

  useEffect(() => {
    const handleToggle = () => {
      if (!isSettingsOpen) {
        setOpen((prev) => !prev);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.sidebar-toggle')
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('toggleSidebar', handleToggle);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('toggleSidebar', handleToggle);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, isSettingsOpen]);

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setOpen(false);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        style={{ width: '300px' }}
        className={classNames(
          'flex selection-accent flex-col side-menu fixed top-0 h-full rounded-r-[24px]',
          'bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-r border-black/5 dark:border-white/[0.04]',
          'shadow-xl text-sm',
          isSettingsOpen ? 'z-40' : 'z-sidebar',
        )}
      >
        <div className="h-16 flex items-center justify-between px-6">
          <div className="text-gray-900 dark:text-white font-semibold flex items-center gap-2.5 tracking-tight text-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            Kua
          </div>
          <button
            className="p-2 rounded-xl bg-black dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200 shadow-md active:scale-95"
            onClick={() => setOpen(false)}
            aria-label="Close Sidebar"
          >
            <div className="i-ph:sidebar-simple-bold text-xl" />
          </button>
        </div>

        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4 space-y-4">
            <a
              href="/"
              className="flex gap-2 items-center justify-center bg-blue-600 text-white hover:bg-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.2)] rounded-xl px-4 py-3 transition-all duration-200 group active:scale-[0.98]"
            >
              <span className="inline-block i-ph:plus-bold h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="text-sm font-semibold">New Chat</span>
            </a>

            <div className="relative w-full group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <span className="i-ph:magnifying-glass h-4 w-4 text-gray-400 dark:text-gray-500 transition-colors group-focus-within:text-blue-500" />
              </div>
              <input
                className={classNames(
                  'w-full bg-black/5 dark:bg-white/5 border border-transparent relative pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-[#111] focus:border-blue-500/50',
                  'text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200',
                )}
                type="search"
                placeholder="Search conversations..."
                onChange={handleSearchChange}
                aria-label="Search chats"
              />
            </div>
          </div>

          <div className="px-6 py-2">
            <div className="font-semibold text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
              History
            </div>
          </div>

          <div className="flex-1 overflow-auto px-3 pb-3 custom-scrollbar">
            {filteredList.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-500 text-xs italic">
                {list.length === 0 ? 'No conversations yet' : 'No results found'}
              </div>
            )}
            <DialogRoot open={dialogContent !== null}>
              <div className="space-y-1 pr-1">
                {filteredList.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onDelete={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDialogContent({ type: 'delete', item });
                    }}
                  />
                ))}
              </div>
              <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                {dialogContent?.type === 'delete' && (
                  <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#0D0D0D] border border-black/5 dark:border-white/5 shadow-2xl">
                    <div className="p-6">
                      <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Delete Conversation
                      </DialogTitle>
                      <div className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                        Are you sure you want to delete{' '}
                        <span className="font-medium text-gray-900 dark:text-white inline-block px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/5">
                          "{dialogContent.item.description}"
                        </span>
                        ? This action cannot be undone.
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5">
                      <DialogButton type="secondary" onClick={closeDialog}>
                        Cancel
                      </DialogButton>
                      <DialogButton
                        type="danger"
                        onClick={(event) => {
                          deleteItem(event, dialogContent.item);
                          closeDialog();
                        }}
                      >
                        Delete
                      </DialogButton>
                    </div>
                  </div>
                )}
              </Dialog>
            </DialogRoot>
          </div>

          <div className="mt-auto border-t border-black/5 dark:border-white/[0.04] p-4 bg-black/[0.01] dark:bg-white/[0.01]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 group px-2 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 flex-1 min-w-0">
                <div className="relative shrink-0">
                  <div className="flex items-center justify-center w-9 h-9 overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5 text-zinc-500 dark:text-zinc-400 rounded-lg shadow-sm">
                    {profile?.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile?.username || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="i-ph:user-duotone text-xl" />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#0A0A0A] rounded-full shadow-sm"></div>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate tracking-tight">
                    {profile?.username || 'Guest'}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-tighter">
                    Free Plan
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <SettingsButton onClick={handleSettingsClick} />
                <ThemeSwitch />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ControlPanel open={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
};
