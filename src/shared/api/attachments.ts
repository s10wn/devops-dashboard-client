import { config } from '@shared/config';
import { getAccessToken } from './apollo-client';

export type Attachment = {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  } | null;
};

type UploadResponse = {
  message: string;
  attachment: Attachment;
};

type DeleteResponse = {
  message: string;
  success: boolean;
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const attachmentsApi = {
  async uploadFile(taskId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = getAuthHeaders();
    const response = await fetch(`${config.apiUrl}/api/attachments/task/${taskId}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    const data: UploadResponse = await response.json();
    return data.attachment;
  },

  async getTaskAttachments(taskId: string): Promise<Attachment[]> {
    const response = await fetch(`${config.apiUrl}/api/attachments/task/${taskId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch attachments');
    }

    return response.json();
  },

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const response = await fetch(`${config.apiUrl}/api/attachments/${attachmentId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || 'Delete failed');
    }

    const data: DeleteResponse = await response.json();
    return data.success;
  },

  getDownloadUrl(attachmentId: string): string {
    return `${config.apiUrl}/api/attachments/${attachmentId}/download`;
  },

  async uploadInlineImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.apiUrl}/api/attachments/inline`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to upload image' }));
      throw new Error(error.message || 'Failed to upload image');
    }

    const data: { url: string } = await response.json();
    return data.url;
  },
};
