<template>
  <div class="creative-uploader">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1">
          <i class="bi bi-camera me-2 text-primary"></i>Creative Uploader
        </h4>
        <p class="text-muted small mb-0">
          Upload images and videos for your TikTok ads
        </p>
      </div>
      <button 
        class="btn btn-outline-secondary" 
        @click="$emit('close')"
        :disabled="uploading"
      >
        <i class="bi bi-x me-1"></i>Close
      </button>
    </div>

    <!-- Upload Section -->
    <div class="row g-4 mb-4">
      <!-- Image Upload -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-image me-2"></i>Upload Images
            </h6>
          </div>
          <div class="card-body">
            <!-- Drop Zone -->
            <div 
              class="drop-zone"
              :class="{ 'drag-over': imageDragOver, 'uploading': uploading }"
              @dragover.prevent="imageDragOver = true"
              @dragleave.prevent="imageDragOver = false"
              @drop.prevent="handleImageDrop"
              @click="$refs.imageInput.click()"
            >
              <div class="text-center py-4">
                <i class="bi bi-cloud-upload display-6 text-muted mb-2"></i>
                <p class="mb-2">Drag & drop images here or <strong>click to browse</strong></p>
                <small class="text-muted">
                  Supported: JPG, PNG, GIF<br>
                  Max size: 10MB | Min: 200x200px
                </small>
              </div>
            </div>
            
            <input 
              ref="imageInput"
              type="file" 
              multiple
              accept="image/*"
              style="display: none"
              @change="handleImageSelect"
            />

            <!-- Image Previews -->
            <div v-if="imageFiles.length > 0" class="mt-3">
              <h6 class="mb-2">Selected Images</h6>
              <div class="row g-2">
                <div 
                  v-for="(file, index) in imageFiles" 
                  :key="index"
                  class="col-6 col-md-4"
                >
                  <div class="image-preview">
                    <img :src="file.preview" alt="Preview" class="img-fluid rounded">
                    <button 
                      class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                      @click="removeImageFile(index)"
                      :disabled="uploading"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                    <div v-if="file.uploading" class="upload-overlay">
                      <div class="spinner-border spinner-border-sm text-light"></div>
                    </div>
                    <div v-if="file.uploaded" class="upload-overlay bg-success">
                      <i class="bi bi-check-circle text-light"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Video Upload -->
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">
            <h6 class="mb-0">
              <i class="bi bi-camera-video me-2"></i>Upload Videos
            </h6>
          </div>
          <div class="card-body">
            <!-- Drop Zone -->
            <div 
              class="drop-zone"
              :class="{ 'drag-over': videoDragOver, 'uploading': uploading }"
              @dragover.prevent="videoDragOver = true"
              @dragleave.prevent="videoDragOver = false"
              @drop.prevent="handleVideoDrop"
              @click="$refs.videoInput.click()"
            >
              <div class="text-center py-4">
                <i class="bi bi-camera-video display-6 text-muted mb-2"></i>
                <p class="mb-2">Drag & drop videos here or <strong>click to browse</strong></p>
                <small class="text-muted">
                  Supported: MP4, MOV, AVI<br>
                  Max size: 500MB | Duration: 5-60s
                </small>
              </div>
            </div>
            
            <input 
              ref="videoInput"
              type="file" 
              multiple
              accept="video/*"
              style="display: none"
              @change="handleVideoSelect"
            />

            <!-- Video Previews -->
            <div v-if="videoFiles.length > 0" class="mt-3">
              <h6 class="mb-2">Selected Videos</h6>
              <div class="row g-2">
                <div 
                  v-for="(file, index) in videoFiles" 
                  :key="index"
                  class="col-12 col-md-6"
                >
                  <div class="video-preview">
                    <video :src="file.preview" class="img-fluid rounded" controls></video>
                    <button 
                      class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                      @click="removeVideoFile(index)"
                      :disabled="uploading"
                    >
                      <i class="bi bi-x"></i>
                    </button>
                    <div v-if="file.uploading" class="upload-overlay">
                      <div class="spinner-border spinner-border-sm text-light"></div>
                    </div>
                    <div v-if="file.uploaded" class="upload-overlay bg-success">
                      <i class="bi bi-check-circle text-light"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Actions -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <span class="text-muted">
          {{ imageFiles.length }} images, {{ videoFiles.length }} videos selected
        </span>
      </div>
      <div>
        <button 
          class="btn btn-outline-secondary me-2"
          @click="clearAllFiles"
          :disabled="uploading || (imageFiles.length === 0 && videoFiles.length === 0)"
        >
          <i class="bi bi-trash me-1"></i>Clear All
        </button>
        <button 
          class="btn btn-primary"
          @click="uploadAllFiles"
          :disabled="uploading || (imageFiles.length === 0 && videoFiles.length === 0)"
        >
          <div v-if="uploading" class="spinner-border spinner-border-sm me-2" role="status"></div>
          <i v-else class="bi bi-cloud-upload me-1"></i>
          {{ uploading ? 'Uploading...' : 'Upload All' }}
        </button>
      </div>
    </div>

    <!-- Uploaded Media Library -->
    <div class="card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h6 class="mb-0">
            <i class="bi bi-collection me-2"></i>Media Library
          </h6>
          <button 
            class="btn btn-outline-primary btn-sm"
            @click="loadMediaLibrary"
            :disabled="mediaLoading"
          >
            <div v-if="mediaLoading" class="spinner-border spinner-border-sm me-1" role="status"></div>
            <i v-else class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="mediaLoading" class="text-center py-4">
          <div class="spinner-border" role="status"></div>
          <p class="mt-2 text-muted">Loading media library...</p>
        </div>
        
        <div v-else-if="mediaLibrary.images.length === 0 && mediaLibrary.videos.length === 0" class="text-center py-4">
          <i class="bi bi-folder2-open display-6 text-muted"></i>
          <p class="text-muted mt-2">No media uploaded yet</p>
        </div>

        <div v-else>
          <!-- Images -->
          <div v-if="mediaLibrary.images.length > 0" class="mb-4">
            <h6 class="mb-2">Images ({{ mediaLibrary.images.length }})</h6>
            <div class="row g-2">
              <div 
                v-for="image in mediaLibrary.images" 
                :key="image.image_id"
                class="col-6 col-md-3 col-lg-2"
              >
                <div class="media-item">
                  <img 
                    :src="image.preview_url || image.image_url" 
                    :alt="image.filename"
                    class="img-fluid rounded"
                  />
                  <div class="media-info">
                    <small class="text-muted d-block">{{ image.filename }}</small>
                    <small class="text-muted">{{ formatFileSize(image.size) }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Videos -->
          <div v-if="mediaLibrary.videos.length > 0">
            <h6 class="mb-2">Videos ({{ mediaLibrary.videos.length }})</h6>
            <div class="row g-2">
              <div 
                v-for="video in mediaLibrary.videos" 
                :key="video.video_id"
                class="col-12 col-md-6 col-lg-4"
              >
                <div class="media-item">
                  <video 
                    :src="video.preview_url || video.video_url" 
                    class="img-fluid rounded"
                    controls
                  ></video>
                  <div class="media-info">
                    <small class="text-muted d-block">{{ video.filename }}</small>
                    <small class="text-muted">{{ formatFileSize(video.size) }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useTikTokStore } from '../../stores/tiktokStore'

export default {
  name: 'TikTokCreativeUploader',
  emits: ['close', 'media-uploaded'],
  setup(props, { emit }) {
    const store = useTikTokStore()
    
    // State
    const imageFiles = ref([])
    const videoFiles = ref([])
    const imageDragOver = ref(false)
    const videoDragOver = ref(false)
    const uploading = ref(false)
    const mediaLoading = ref(false)
    
    const mediaLibrary = reactive({
      images: [],
      videos: []
    })

    // File validation
    const validateImageFile = (file) => {
      const maxSize = 10 * 1024 * 1024 // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      
      if (!allowedTypes.includes(file.type)) {
        store.showError('Invalid image format. Please use JPG, PNG, or GIF.')
        return false
      }
      
      if (file.size > maxSize) {
        store.showError('Image too large. Maximum size is 10MB.')
        return false
      }
      
      return true
    }

    const validateVideoFile = (file) => {
      const maxSize = 500 * 1024 * 1024 // 500MB
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo']
      
      if (!allowedTypes.includes(file.type)) {
        store.showError('Invalid video format. Please use MP4, MOV, or AVI.')
        return false
      }
      
      if (file.size > maxSize) {
        store.showError('Video too large. Maximum size is 500MB.')
        return false
      }
      
      return true
    }

    // File processing
    const processFiles = (files, type) => {
      const fileArray = Array.from(files)
      const processedFiles = []

      fileArray.forEach(file => {
        const isValid = type === 'image' ? validateImageFile(file) : validateVideoFile(file)
        if (!isValid) return

        const fileObj = {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview: URL.createObjectURL(file),
          uploading: false,
          uploaded: false
        }
        
        processedFiles.push(fileObj)
      })

      if (type === 'image') {
        imageFiles.value = [...imageFiles.value, ...processedFiles]
      } else {
        videoFiles.value = [...videoFiles.value, ...processedFiles]
      }
    }

    // Event handlers
    const handleImageDrop = (e) => {
      imageDragOver.value = false
      const files = e.dataTransfer.files
      processFiles(files, 'image')
    }

    const handleVideoDrop = (e) => {
      videoDragOver.value = false
      const files = e.dataTransfer.files
      processFiles(files, 'video')
    }

    const handleImageSelect = (e) => {
      processFiles(e.target.files, 'image')
      e.target.value = '' // Reset input
    }

    const handleVideoSelect = (e) => {
      processFiles(e.target.files, 'video')
      e.target.value = '' // Reset input
    }

    const removeImageFile = (index) => {
      URL.revokeObjectURL(imageFiles.value[index].preview)
      imageFiles.value.splice(index, 1)
    }

    const removeVideoFile = (index) => {
      URL.revokeObjectURL(videoFiles.value[index].preview)
      videoFiles.value.splice(index, 1)
    }

    const clearAllFiles = () => {
      imageFiles.value.forEach(file => URL.revokeObjectURL(file.preview))
      videoFiles.value.forEach(file => URL.revokeObjectURL(file.preview))
      imageFiles.value = []
      videoFiles.value = []
    }

    // Upload functions
    const uploadFile = async (fileObj, type) => {
      if (!store.accessToken || !store.selectedAdvertiserId) {
        store.showError('Please authenticate and select an advertiser account first.')
        return false
      }

      fileObj.uploading = true

      try {
        // Convert file to base64
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(fileObj.file)
        })

        const endpoint = type === 'image' ? '/tiktok/creative/image/upload' : '/tiktok/creative/video/upload'
        const dataKey = type === 'image' ? 'image_data' : 'video_data'
        const nameKey = type === 'image' ? 'image_name' : 'video_name'

        const response = await store.apiRequest(endpoint, 'POST', {
          access_token: store.accessToken,
          advertiser_id: store.selectedAdvertiserId,
          [dataKey]: base64Data,
          [nameKey]: fileObj.name
        })

        if (response.success && response.data?.code === 0) {
          fileObj.uploaded = true
          fileObj.uploadedData = response.data.data
          store.showSuccess(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`)
          emit('media-uploaded', { type, data: response.data.data })
          return true
        } else {
          store.showError(`Failed to upload ${type}: ${response.data?.message || 'Unknown error'}`)
          return false
        }
      } catch (error) {
        console.error(`${type} upload error:`, error)
        store.showError(`Failed to upload ${type}: ${error.message}`)
        return false
      } finally {
        fileObj.uploading = false
      }
    }

    const uploadAllFiles = async () => {
      if (uploading.value) return
      
      uploading.value = true
      const allFiles = [...imageFiles.value, ...videoFiles.value]
      let successCount = 0

      try {
        for (const file of imageFiles.value) {
          if (!file.uploaded) {
            const success = await uploadFile(file, 'image')
            if (success) successCount++
          }
        }

        for (const file of videoFiles.value) {
          if (!file.uploaded) {
            const success = await uploadFile(file, 'video')
            if (success) successCount++
          }
        }

        if (successCount > 0) {
          store.showSuccess(`${successCount} file(s) uploaded successfully!`)
          await loadMediaLibrary() // Refresh media library
        }
      } finally {
        uploading.value = false
      }
    }

    // Media library
    const loadMediaLibrary = async () => {
      if (!store.accessToken || !store.selectedAdvertiserId) return

      mediaLoading.value = true
      try {
        const response = await store.apiRequest('/tiktok/creative/media/list', 'GET', {
          access_token: store.accessToken,
          advertiser_id: store.selectedAdvertiserId
        })

        if (response.success) {
          mediaLibrary.images = response.data.data?.images || response.data.images || []
          mediaLibrary.videos = response.data.data?.videos || response.data.videos || []
        }
      } catch (error) {
        console.error('Failed to load media library:', error)
      } finally {
        mediaLoading.value = false
      }
    }

    // Utilities
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Lifecycle
    onMounted(() => {
      loadMediaLibrary()
    })

    return {
      // State
      imageFiles,
      videoFiles,
      imageDragOver,
      videoDragOver,
      uploading,
      mediaLoading,
      mediaLibrary,
      
      // Methods
      handleImageDrop,
      handleVideoDrop,
      handleImageSelect,
      handleVideoSelect,
      removeImageFile,
      removeVideoFile,
      clearAllFiles,
      uploadAllFiles,
      loadMediaLibrary,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #dee2e6;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.drop-zone:hover {
  border-color: #0d6efd;
  background-color: #e7f1ff;
}

.drop-zone.drag-over {
  border-color: #0d6efd;
  background-color: #e7f1ff;
  transform: scale(1.02);
}

.drop-zone.uploading {
  opacity: 0.7;
  cursor: not-allowed;
}

.image-preview,
.video-preview,
.media-item {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
}

.media-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 0.5rem;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.media-item:hover .media-info {
  transform: translateY(0);
}
</style>