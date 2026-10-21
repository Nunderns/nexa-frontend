import { request } from '@/lib/api-client';
import type { Media } from '@/types/api';

export const mediaApi = {
  /**
   * Multipart upload to an IMAGE or VIDEO post owned by the user. Axios drops
   * the instance's JSON `Content-Type` for `FormData`, so the browser sets the
   * multipart boundary itself.
   */
  uploadFile: (postId: number, file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData();
    form.append('postId', String(postId));
    form.append('file', file);

    return request<Media>({
      method: 'POST',
      url: '/media/upload',
      data: form,
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });
  },

  getByPost: (postId: number) => request<Media[]>({ method: 'GET', url: `/media/post/${postId}` }),
};
