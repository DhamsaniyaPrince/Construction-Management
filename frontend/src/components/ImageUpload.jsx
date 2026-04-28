import { useState, useRef, useCallback } from 'react';
import { Upload, X, Link, Image as ImageIcon } from 'lucide-react';

const ImageUpload = ({ onImageUpload, existingUrl = '' }) => {
  const [imageUrl, setImageUrl] = useState(existingUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url', 'file', 'paste'
  const fileInputRef = useRef(null);
  const pasteAreaRef = useRef(null);

  // Handle file upload (drag & drop or file selection)
  const handleFileUpload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a temporary URL for the uploaded file
      // In production, you would upload this to a cloud service
      const tempUrl = URL.createObjectURL(file);
      
      // For now, we'll convert to base64 to store the image
      const base64 = await fileToBase64(file);
      setImageUrl(base64);
      onImageUpload(base64);
      
      // Show success message
      setTimeout(() => {
        alert('Image uploaded successfully!');
      }, 100);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload]);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle drag and drop events
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
      setUploadMethod('file');
    } else {
      alert('Please drop an image file');
    }
  }, [handleFileUpload]);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
      setUploadMethod('file');
    }
  }, [handleFileUpload]);

  // Handle paste event
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        handleFileUpload(file);
        setUploadMethod('paste');
      }
    } else {
      alert('Please copy an image to paste');
    }
  }, [handleFileUpload]);

  // Handle URL input change
  const handleUrlChange = useCallback((e) => {
    const url = e.target.value;
    setImageUrl(url);
    setUploadMethod('url');
    onImageUpload(url);
  }, [onImageUpload]);

  // Clear image
  const handleClearImage = useCallback(() => {
    setImageUrl('');
    onImageUpload('');
    setUploadMethod('url');
  }, [onImageUpload]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Method Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
        <button
          onClick={() => setUploadMethod('url')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            uploadMethod === 'url'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <Link size={16} />
          URL
        </button>
        <button
          onClick={() => setUploadMethod('file')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            uploadMethod === 'file'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          onClick={() => setUploadMethod('paste')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            uploadMethod === 'paste'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <ImageIcon size={16} />
          Paste
        </button>
      </div>

      {/* URL Input Method */}
      {uploadMethod === 'url' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            placeholder="Enter image URL (e.g., from cloud storage)"
            value={imageUrl}
            onChange={handleUrlChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {imageUrl && imageUrl.startsWith('http') && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={() => alert('Failed to load image from URL')}
              />
            </div>
          )}
        </div>
      )}

      {/* File Upload Method */}
      {uploadMethod === 'file' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Upload Image File
          </label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop an image here, or click to select
            </p>
            <button
              type="button"
              onClick={triggerFileInput}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
          
          {imageUrl && imageUrl.startsWith('data:') && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Paste Method */}
      {uploadMethod === 'paste' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Paste Image (Ctrl+C / Ctrl+V)
          </label>
          <div
            ref={pasteAreaRef}
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onPaste={handlePaste}
            tabIndex={0}
            contentEditable={false}
          >
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Copy an image and paste it here (Ctrl+V)
            </p>
            <p className="text-xs text-gray-500">
              You can also drag and drop an image here
            </p>
          </div>
          
          {imageUrl && imageUrl.startsWith('data:') && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Clear Button */}
      {imageUrl && (
        <button
          type="button"
          onClick={handleClearImage}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X size={16} />
          Clear Image
        </button>
      )}
    </div>
  );
};

export default ImageUpload;
