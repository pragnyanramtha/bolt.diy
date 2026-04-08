import React from 'react';

interface FilePreviewProps {
  files: File[];
  imageDataList: string[];
  onRemove: (index: number) => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ files, imageDataList, onRemove }) => {
  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row overflow-x-auto gap-3 p-3 bg-black/10 dark:bg-black/20 border border-white/10 rounded-xl">
      {files.map((file, index) => (
        <div key={file.name + file.size} className="relative group shrink-0">
          {imageDataList[index] && imageDataList[index].startsWith('data:image') ? (
            <>
              <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/20 backdrop-blur-md">
                <img src={imageDataList[index]} alt={file.name} className="max-h-24 w-auto object-cover" />
                <div className="absolute bottom-0 w-full flex items-center px-2 py-1 text-white font-medium text-[10px] bg-black/60 backdrop-blur-md">
                  <span className="truncate">{file.name}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative border border-white/10 rounded-lg overflow-hidden bg-[#1A1C21] backdrop-blur-md h-24 w-28 flex flex-col">
                <div className="p-2 text-[7px] text-[#A3A3A3] leading-tight break-words text-left flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {imageDataList[index]?.replace('text:', '')}
                </div>
                <div className="absolute bottom-0 w-full flex items-center px-1.5 py-1 text-white font-medium text-[10px] bg-black/60 backdrop-blur-md border-t border-white/5">
                  <div className="i-ph:file-text text-[#2A65D6] mr-1 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-2.5 -right-2.5 z-10 bg-[#333] hover:bg-[#D95757] rounded-full w-5 h-5 shadow-lg transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="i-ph:x w-3 h-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default FilePreview;
