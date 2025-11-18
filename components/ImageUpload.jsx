'use client';

import { useState } from 'react';
import { imageToBase64, validateImageFile } from '@/lib/image-utils';

export default function ImageUpload({ onImageUpload, disabled }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError('');

    try {
      // Convert to base64
      const imageData = await imageToBase64(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Notify parent
      onImageUpload(imageData);
    } catch (err) {
      setError('Failed to process image');
      console.error(err);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setError('');
    onImageUpload(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload diagram image</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>

      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="w-full rounded-lg border border-gray-300" />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            disabled={disabled}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

