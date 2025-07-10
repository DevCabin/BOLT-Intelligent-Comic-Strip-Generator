import { useState } from 'react';

export const useGoogleDrive = () => {
  const [isUploading, setIsUploading] = useState(false);

  const createFolder = async (folderName: string, parentFolderId?: string): Promise<string | null> => {
    try {
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const response = await window.gapi.client.drive.files.create({
        resource: metadata,
      });

      return response.result.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  };

  const findFolder = async (folderName: string, parentFolderId?: string): Promise<string | null> => {
    try {
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name)',
      });

      const folders = response.result.files;
      return folders && folders.length > 0 ? folders[0].id : null;
    } catch (error) {
      console.error('Error finding folder:', error);
      return null;
    }
  };

  const getOrCreateProjectFolder = async (projectName: string): Promise<string | null> => {
    try {
      // First, find or create the main "Comic Strip Generator" folder
      let mainFolderId = await findFolder('Comic Strip Generator');
      if (!mainFolderId) {
        mainFolderId = await createFolder('Comic Strip Generator');
      }

      if (!mainFolderId) return null;

      // Then, find or create the project-specific folder
      let projectFolderId = await findFolder(projectName, mainFolderId);
      if (!projectFolderId) {
        projectFolderId = await createFolder(projectName, mainFolderId);
      }

      return projectFolderId;
    } catch (error) {
      console.error('Error getting/creating project folder:', error);
      return null;
    }
  };

  const uploadImageToDrive = async (
    imageUrl: string,
    fileName: string,
    projectName: string,
    description: string
  ): Promise<boolean> => {
    setIsUploading(true);

    try {
      // Get or create project folder
      const folderId = await getOrCreateProjectFolder(projectName);
      if (!folderId) {
        throw new Error('Failed to create project folder');
      }

      // Convert image URL to blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create file metadata
      const metadata = {
        name: fileName,
        parents: [folderId],
        description: description,
      };

      // Upload file
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', blob);

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: new Headers({
            Authorization: `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`,
          }),
          body: form,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      return true;
    } catch (error) {
      console.error('Error uploading to Drive:', error);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImageToDrive,
    isUploading,
  };
};