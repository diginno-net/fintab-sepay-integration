export type ArtifactResponse = {
  type: 'url' | 'base64' | 'binary';
  url?: string;
  data?: string;
  contentType?: string;
  filename?: string;
};

function downloadBlob(base64: string, filename: string, contentType?: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: contentType ?? 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  if (a instanceof Node) document.body.appendChild(a);
  a.click();
  if (a instanceof Node) document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function getFilename(artifact: ArtifactResponse, fallback: string): string {
  return artifact.filename ?? fallback;
}

export async function viewArtifact(invoiceJobId: string, artifact: ArtifactResponse): Promise<void> {
  if (artifact.type === 'url' && artifact.url) {
    openUrl(artifact.url);
    return;
  }
  if ((artifact.type === 'base64' || artifact.type === 'binary') && artifact.data) {
    const filename = getFilename(artifact, `invoice-${invoiceJobId.slice(0, 8)}.pdf`);
    downloadBlob(artifact.data, filename, artifact.contentType);
    return;
  }
  throw new Error('Không có file để hiển thị.');
}

export async function downloadArtifact(
  invoiceJobId: string,
  artifact: ArtifactResponse,
  forceType?: 'pdf' | 'xml'
): Promise<void> {
  const isXml = forceType === 'xml';
  const defaultExt = isXml ? 'xml' : 'pdf';
  const defaultFilename = `invoice-${invoiceJobId.slice(0, 8)}.${defaultExt}`;

  if (artifact.type === 'url' && artifact.url) {
    const a = document.createElement('a');
    a.href = artifact.url;
    a.download = getFilename(artifact, defaultFilename);
    a.target = '_blank';
    if (a instanceof Node) document.body.appendChild(a);
    a.click();
    if (a instanceof Node) document.body.removeChild(a);
    return;
  }

  if ((artifact.type === 'base64' || artifact.type === 'binary') && artifact.data) {
    const filename = getFilename(artifact, defaultFilename);
    const contentType = isXml
      ? 'application/xml'
      : (artifact.contentType ?? (defaultExt === 'xml' ? 'application/xml' : 'application/pdf'));
    downloadBlob(artifact.data, filename, contentType);
    return;
  }

  throw new Error(isXml ? 'Không có file XML để tải.' : 'Không có file để tải.');
}
