import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { McpTools } from './MCPTools';
import { WebSearch } from './WebSearch.client';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  onWebSearchResult?: (result: string) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  return (
    <div className="relative w-full max-w-[760px] mx-auto transition-all duration-300 font-sans px-2 sm:px-4">
      {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-t-lg border border-b-0 border-[#454540] text-[#ECECEC] py-1 px-2.5 font-medium text-xs bg-[#24272E]">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-[#2A65D6] rounded px-1.5 py-1 mr-0.5 text-white">
              {props?.selectedElement?.tagName}
            </code>
            selected for inspection
          </div>
          <button
            className="bg-transparent text-[#2A65D6] pointer-auto"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Clear
          </button>
        </div>
      )}

      <div
        className={classNames(
          'flex flex-col items-stretch transition-all duration-300 relative z-10 cursor-text',
          'rounded-[24px] border border-black/5 dark:border-white/[0.08]',
          'shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
          'bg-white/70 dark:bg-[#0A0A0A]/70 backdrop-blur-2xl ring-1 ring-white/50 dark:ring-white/10',
          props.selectedElement ? 'rounded-t-none' : '',
        )}
      >
        <div className="flex flex-col px-5 pt-5 pb-3.5 gap-3">
          {/* Active File Previews / Screenshot State */}
          <FilePreview
            files={props.uploadedFiles}
            imageDataList={props.imageDataList}
            onRemove={(index) => {
              props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
              props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
            }}
          />
          <ClientOnly>
            {() => (
              <ScreenshotStateManager
                setUploadedFiles={props.setUploadedFiles}
                setImageDataList={props.setImageDataList}
                uploadedFiles={props.uploadedFiles}
                imageDataList={props.imageDataList}
              />
            )}
          </ClientOnly>

          {/* Input Area */}
          <div className="relative mb-1">
            <div className="w-full font-sans break-words transition-opacity duration-200 pl-1">
              <textarea
                ref={props.textareaRef}
                value={props.input}
                onChange={(e) => props.handleInputChange?.(e)}
                onPaste={props.handlePaste}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    if (event.shiftKey) {
                      return;
                    }

                    event.preventDefault();

                    if (props.isStreaming) {
                      props.handleStop?.();
                      return;
                    }

                    if (event.nativeEvent.isComposing) {
                      return;
                    }

                    props.handleSendMessage?.(event);
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.border = '2px dashed #2A65D6';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.border = '2px dashed #2A65D6';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.border = 'none';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.border = 'none';

                  const files = Array.from(e.dataTransfer.files);
                  files.forEach((file) => {
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();

                      reader.onload = (e) => {
                        const base64Image = e.target?.result as string;
                        props.setUploadedFiles?.([...props.uploadedFiles, file]);
                        props.setImageDataList?.([...props.imageDataList, base64Image]);
                      };
                      reader.readAsDataURL(file);
                    }
                  });
                }}
                placeholder={
                  props.chatMode === 'build' ? 'What would you like to build today ?' : 'How can I help you today?'
                }
                className="w-full !bg-transparent border-none focus:ring-0 outline-none text-gray-900 dark:text-gray-100 text-[17px] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none overflow-y-auto modern-scrollbar py-0 leading-relaxed block font-normal antialiased"
                rows={1}
                autoFocus
                style={{
                  minHeight: '4.5rem',
                  maxHeight: '350px',
                  boxShadow: 'none',
                }}
                translate="no"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex gap-2 w-full justify-between items-center mt-1">
            {/* Left Tools */}
            <div className="flex items-center gap-1">
              {/* Add Files */}
              <button
                onClick={() => props.handleFileUpload()}
                className="inline-flex items-center justify-center p-2 transition-all duration-200 rounded-xl active:scale-95 !bg-transparent hover:!bg-black/5 dark:hover:!bg-white/10 text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white"
                title="Upload file"
                aria-label="Upload file"
              >
                <div className="i-ph:plus text-xl"></div>
              </button>

              {/* Enhance Prompt */}
              <button
                title="Enhance prompt"
                disabled={props.input.length === 0 || props.enhancingPrompt}
                className={classNames(
                  'inline-flex items-center justify-center p-2 transition-all duration-200 rounded-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed !bg-transparent hover:!bg-black/5 dark:hover:!bg-white/10',
                  props.enhancingPrompt
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-white/50 dark:hover:text-white',
                )}
                onClick={() => {
                  props.enhancePrompt?.();
                  toast.success('Prompt enhanced!');
                }}
              >
                {props.enhancingPrompt ? (
                  <div className="i-svg-spinners:90-ring-with-bg text-blue-500 text-xl animate-spin"></div>
                ) : (
                  <div className="i-ph:sparkle text-xl"></div>
                )}
              </button>
            </div>

            {/* Right Tools - Send Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={(event) => {
                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                    props.handleSendMessage?.(event);
                  }
                }}
                disabled={!props.input.length && !props.uploadedFiles.length && !props.isStreaming}
                className={classNames(
                  'inline-flex items-center justify-center transition-all duration-200 rounded-xl h-10 w-10 active:scale-95',
                  props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'bg-black/5 dark:bg-white/10 text-gray-400 dark:text-white/40 cursor-default',
                )}
                aria-label={props.isStreaming ? 'Stop' : 'Send message'}
              >
                {props.isStreaming ? (
                  <div className="i-ph:square-fill text-sm"></div>
                ) : (
                  <div className="i-ph:arrow-up text-sm font-bold"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
