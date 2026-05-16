"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

const DocViewer = dynamic(() => import("@cyntler/react-doc-viewer"), { ssr: false });

export function InAppDocViewer({
  url,
  name,
  onClose,
}: {
  url: string;
  name: string;
  onClose: () => void;
}) {
  return (
    <div className="w-full bg-surface rounded-bubble-lg border-[3px] border-border flex flex-col overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "400px" }}>
      <div className="p-3 border-b-[2px] border-border flex items-center justify-between shrink-0">
        <p className="text-sm font-bold text-foreground/80 truncate">{name}</p>
        <button onClick={onClose} className="p-2 rounded-bubble-sm hover:bg-background cursor-pointer">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-background">
        <DocViewer
          documents={[{ uri: url, fileName: name }]}
          pluginRenderers={DocViewerRenderers}
          config={{
            header: {
              disableHeader: false,
              disableFileName: true,
              retainURLParams: true,
            },
          }}
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
}
