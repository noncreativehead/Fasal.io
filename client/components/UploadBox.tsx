import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Check, Loader } from 'lucide-react';

interface UploadBoxProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  onImageSelected?: (file: File, preview: string) => void;
}

export default function UploadBox({ isLoggedIn = false, onLoginRequired, onImageSelected }: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const acceptedFormats = ['.jpg', '.jpeg', '.png', '.webp'];

  const handleFile = (file: File) => {
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }

    if (!acceptedFormats.some((format) => file.name.toLowerCase().endsWith(format))) {
      alert('Please upload a valid image format: JPG, JPEG, PNG, or WEBP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onImageSelected?.(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleDetect = async () => {
    if (!selectedFile || !preview) return;

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/detect', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisResult(data.result || 'Analysis completed. Your crop appears to be healthy!');
      } else {
        setAnalysisResult('Unable to analyze image. Please try again.');
      }
    } catch (error) {
      setAnalysisResult('Error analyzing image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragActive
            ? 'border-green-400 bg-green-900/40'
            : 'border-green-700/50 bg-green-900/20 hover:bg-green-900/30'
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-green-700/10" />
        </div>

        {/* Content */}
        <div className="p-12 text-center">
          {!preview ? (
            <motion.div
              animate={{ scale: dragActive ? 1.05 : 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => !isLoggedIn && onLoginRequired ? onLoginRequired() : fileInputRef.current?.click()}
              className="space-y-4"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex justify-center"
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600/40 to-green-700/30">
                  <Upload className="w-10 h-10 text-green-300" />
                </div>
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Upload Crop Image</h3>
                <p className="text-green-200/70 mb-2">Drag and drop your image or click to browse</p>
                <p className="text-green-200/50 text-sm">Supported formats: JPG, PNG, WEBP (Max 10MB)</p>
              </div>

              {!isLoggedIn && (
                <p className="text-yellow-400 text-sm mt-4">👤 Please log in to upload images</p>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative inline-block max-w-sm mx-auto"
              >
                <img src={preview} alt="Preview" className="rounded-2xl max-h-96 object-cover shadow-lg" />

                {/* Clear button */}
                {!isAnalyzing && !analysisResult && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </motion.div>

              {/* Status text */}
              {analysisResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-green-700/20 border border-green-600/50"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-green-200">Analysis Complete</span>
                  </div>
                  <p className="text-green-100/90">{analysisResult}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearImage}
                    className="mt-4 px-6 py-2 bg-green-600/30 hover:bg-green-600/50 border border-green-500/50 rounded-xl text-green-200 transition-all"
                  >
                    Upload Another Image
                  </motion.button>
                </motion.div>
              ) : (
                <p className="text-green-100/70">Image ready for analysis</p>
              )}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleChange}
          className="hidden"
          disabled={!isLoggedIn}
        />
      </motion.div>

      {/* Detect button */}
      {preview && !analysisResult && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDetect}
          disabled={isAnalyzing}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
            isAnalyzing
              ? 'bg-green-600/50 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-2xl hover:shadow-green-500/50'
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="w-5 h-5 animate-spin" />
              Analyzing...
            </div>
          ) : (
            'Detect Disease'
          )}
        </motion.button>
      )}
    </div>
  );
}
