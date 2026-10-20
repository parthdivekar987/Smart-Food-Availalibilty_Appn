import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { ui } from '../../utils/swalHelper';
import { getPhotoUrl } from '../../utils/photoUrl';
import { MOCK_ITEMS, saveLocalMenuItems } from '../../api/mockData';

interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
}

const MySwal = withReactContent(Swal);

export default function PhotoManager({ itemId, photos = [], onRefresh }: { itemId: string, photos: Photo[], onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>(photos);

  useEffect(() => {
    setCurrentPhotos(photos || []);
  }, [photos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));

    const loadId = toast.loading("Uploading image...");
    setUploading(true);

    try {
      await axiosClient.post(`/menu/menu-items/${itemId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Images uploaded successfully!", { id: loadId, duration: 2000 });
      onRefresh();
    } catch (err) {
      console.warn("Backend upload offline/failed. Falling back to local image reader:", err);
      try {
        // Read selected images (JPEG, PNG, WebP) as Data URLs for instant preview & offline persistence
        const newLocalPhotos: Photo[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          newLocalPhotos.push({
            id: `photo-${Date.now()}-${i}`,
            url: dataUrl,
            isPrimary: (currentPhotos.length === 0 && i === 0)
          });
        }

        const merged = [...currentPhotos, ...newLocalPhotos];
        setCurrentPhotos(merged);

        // Update MOCK_ITEMS in memory
        const targetMock = MOCK_ITEMS.find(m => m.id === itemId);
        if (targetMock) {
          targetMock.photos = merged as any;
          saveLocalMenuItems();
        }

        toast.success(`${files.length} image(s) uploaded successfully!`, { id: loadId, duration: 2500 });
        onRefresh();
      } catch (readErr) {
        toast.error("Could not process image file. Please use JPEG or PNG.", { id: loadId });
      }
    } finally {
      setUploading(false);
      // Reset input value to allow re-uploading the same file if needed
      e.target.value = '';
    }
  };

  const handleDelete = async (photoId: string) => {
    const result = await ui.confirmDelete(
      "Delete photo?", 
      "This photo will be removed from the item menu."
    );

    if (result.isConfirmed) {
      try {
        await axiosClient.delete(`/menu/photos/${photoId}`);
      } catch (err) {
        console.warn("Backend offline, removing photo locally", err);
      }

      const updated = currentPhotos.filter(p => p.id !== photoId);
      if (updated.length > 0 && !updated.some(p => p.isPrimary)) {
        updated[0].isPrimary = true;
      }
      setCurrentPhotos(updated);

      const targetMock = MOCK_ITEMS.find(m => m.id === itemId);
      if (targetMock && targetMock.photos) {
        targetMock.photos = updated as any;
      }

      ui.alertSuccess("Photo deleted!");
      onRefresh();
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      await axiosClient.patch('/menu/photos/set-primary', { photoId, itemId });
    } catch (err) {
      console.warn("Backend offline, updating primary photo locally", err);
    }

    const updated = currentPhotos.map(p => ({
      ...p,
      isPrimary: p.id === photoId
    }));
    setCurrentPhotos(updated);

    const targetMock = MOCK_ITEMS.find(m => m.id === itemId);
    if (targetMock && targetMock.photos) {
      targetMock.photos = updated as any;
    }

    ui.alertSuccess("Primary photo updated!");
    onRefresh();
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-sm text-gray-800">Dish Photos (JPEG, PNG, WebP)</h4>
        <span className="text-xs text-gray-500">{currentPhotos.length} photo(s) attached</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-2">
        {currentPhotos?.map((photo: any) => (
          <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white group shadow-sm">
            <img src={getPhotoUrl(photo.url)} alt="menu" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity p-1">
              <button
                type="button"
                onClick={() => handleSetPrimary(photo.id)}
                className="text-[10px] bg-white text-gray-800 px-2 py-1 rounded font-bold cursor-pointer hover:bg-orange-50 w-full text-center"
              >
                {photo.isPrimary ? 'Primary' : 'Set as Primary'}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(photo.id)}
                className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold cursor-pointer hover:bg-red-700 w-full text-center"
              >
                Delete
              </button>
            </div>
            {photo.isPrimary && (
              <div className="absolute top-1 left-1 bg-orange-600 text-[8px] text-white px-1.5 py-0.5 rounded shadow-sm font-bold tracking-wider">
                PRIMARY
              </div>
            )}
          </div>
        ))}
        <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-orange-500 transition-colors group">
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/jpg, image/webp" 
            multiple 
            hidden 
            onChange={handleUpload} 
            disabled={uploading} 
          />
          <span className="text-2xl text-gray-400 group-hover:text-orange-500 font-bold transition-colors">
            {uploading ? '...' : '+'}
          </span>
          <span className="text-[10px] text-gray-400 group-hover:text-orange-500 mt-1 font-semibold transition-colors">
            {uploading ? 'Uploading' : 'Add JPG/PNG'}
          </span>
        </label>
      </div>
    </div>
  );
}