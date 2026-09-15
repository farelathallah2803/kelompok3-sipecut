import { useEffect, useRef } from 'react';
import { getDocument, ProjectDocument } from '@/lib/documentsApi';

const IN_PROGRESS: ProjectDocument['status'][] = ['pending', 'processing_l1', 'processing_embed', 'judgment_running'];

/**
 * Polls one document's status every 3s until it leaves processing / AI judgment.
 * Direct port of silebah's startPolling/stopPolling (frontend/static/js/main.js).
 */
export function usePollDocumentStatus(
  docId: number | null,
  initialStatus: ProjectDocument['status'] | undefined,
  onUpdate: (doc: ProjectDocument) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!docId || !initialStatus || !IN_PROGRESS.includes(initialStatus)) return;

    const interval = setInterval(async () => {
      try {
        const doc = await getDocument(docId);
        onUpdateRef.current(doc);
        if (!IN_PROGRESS.includes(doc.status)) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [docId, initialStatus]);
}
