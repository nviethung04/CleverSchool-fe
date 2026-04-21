import axiosInstance from "./axios";

// Types for Media API
export interface MediaFolder {
  id: string;
  parent_id: string;
  path: string;
  disk_name: string;
  children: MediaFolder[];
}

export interface MediaTree {
  "@type": string;
  id: string;
  parent_id: string;
  path: string;
  disk_name: string;
  children: MediaFolder[];
}

export interface MediaFile {
  id: number;
  file_name: string;
  url: string;
  file_size: string;
  file_mime_type: string;
  file_extension: string;
  disk_name: string;
  type: string;
  path: string;
}

export interface FoldersResponse {
  code: number;
  message: string;
  data: MediaTree;
  error: string;
}

export interface FilesResponse {
  code: number;
  message: string;
  data: {
    "@type": string;
    files: MediaFile[];
    total_count: string;
  };
  error: string;
}

export interface CreateFolderRequest {
  parent_id: number;
  file_path: string;
}

export interface CreateFolderResponse {
  code: number;
  data: null;
  message: string;
}

export interface DeleteResponse {
  code: number;
  message: string;
  data: null;
  error: string;
}

// API Functions
export const mediaApi = {
  // Get folders tree
  getFolders: async (folderId?: string): Promise<FoldersResponse> => {
    try {
      const params = folderId ? { folder_id: folderId } : {};
      const response = await axiosInstance.get("/medias/folders", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching folders:", error);
      throw error;
    }
  },

  // Create new folder
  createFolder: async (
    data: CreateFolderRequest
  ): Promise<CreateFolderResponse> => {
    try {
      const response = await axiosInstance.post("/medias/folders", data);
      return response.data;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw error;
    }
  },

  // Get files in folder
  getFiles: async (
    folderId: string,
    page?: number,
    per_page?: number,
    search?: string
  ): Promise<FilesResponse> => {
    try {
      const params: Record<string, any> = {};
      if (page !== undefined) params.page = page;
      if (per_page !== undefined) params.per_page = per_page;
      if (search && search.trim()) params.search = search.trim();

      const response = await axiosInstance.get(`/medias/files/${folderId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching files:", error);
      throw error;
    }
  },

  // Delete folder
  deleteFolder: async (folderId: string): Promise<DeleteResponse> => {
    try {
      const response = await axiosInstance.delete(
        `/medias/folders/${folderId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting folder:", error);
      throw error;
    }
  },

  // Delete file
  deleteFile: async (fileId: string): Promise<DeleteResponse> => {
    try {
      const response = await axiosInstance.delete(`/medias/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  },
};
