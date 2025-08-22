<template>
  <div class="ad-creator">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mt-4 mb-4">
      <div>
        <h4 class="mb-1">
          <i class="bi bi-plus-circle me-2 text-primary"></i>Ad Creator
        </h4>
        <p class="text-muted small mb-0">
          Create compelling ads for your TikTok campaign
        </p>
        <div v-if="selectedAdGroup" class="mt-2">
          <span class="badge bg-primary">
            <i class="bi bi-collection me-1"></i>
            Ad Group: {{ selectedAdGroup.adgroup_name }}
          </span>
        </div>
      </div>
      <button 
        class="btn btn-outline-secondary" 
        @click="$emit('close')"
        :disabled="creating"
      >
        <i class="bi bi-x me-1"></i>Close
      </button>
    </div>

    <!-- Ad Form -->
    <form @submit.prevent="createAd" class="needs-validation" novalidate>
      <div class="row g-4">
        <!-- Creative Selection -->
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="bi bi-image me-2"></i>Select Creative
              </h6>
            </div>
            <div class="card-body">
              <!-- Video Creative Only -->
              <div class="mb-3">
                <label class="form-label fw-bold">Creative Type <span class="text-danger">*</span></label>
                <div class="alert alert-info">
                  <i class="bi bi-camera-video me-2"></i>Only video creatives are supported
                </div>
              </div>

              <!-- Creative Loading -->
              <div v-if="creativesLoading" class="text-center py-4">
                <div class="spinner-border" role="status"></div>
                <p class="mt-2 text-muted">Loading creatives...</p>
              </div>

              <!-- No Creatives -->
              <div v-else-if="availableCreatives.length === 0 && adForm.creative_type" class="text-center py-4">
                <i class="bi bi-folder2-open display-6 text-muted"></i>
                <p class="text-muted mt-2">No videos uploaded</p>
                <button 
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  @click="$emit('open-uploader')"
                >
                  <i class="bi bi-cloud-upload me-1"></i>Upload videos
                </button>
              </div>

              <!-- Creative Selection -->
              <div v-else-if="availableCreatives.length > 0" class="row g-2">
                <div 
                  v-for="creative in availableCreatives" 
                  :key="creative.id"
                  class="col-6 col-md-4 col-lg-3"
                >
                  <div 
                    class="creative-selector"
                    :class="{ 
                      'selected': adForm.creative_id === creative.id,
                      'recommended': creative.qualityLabel && creative.qualityLabel.startsWith('✅'),
                      'warning': creative.qualityLabel && creative.qualityLabel.startsWith('⚠️')
                    }"
                    @click="selectCreative(creative)"
                  >
                    <video 
                      :src="creative.preview_url || creative.video_url" 
                      class="img-fluid rounded"
                      muted
                      @mouseenter="$event.target.play()"
                      @mouseleave="$event.target.pause()"
                    ></video>
                    <div class="selection-overlay">
                      <i class="bi bi-check-circle display-6 text-success"></i>
                    </div>
                    <div class="creative-info">
                      <small class="text-white d-block">{{ creative.filename }}</small>
                      <small v-if="creative.qualityLabel" class="text-white-50 d-block">{{ creative.qualityLabel }}</small>
                      <small v-if="creative.width && creative.height" class="text-white-50 d-block">
                        {{ creative.width }}×{{ creative.height }} ({{ creative.aspectRatioText }})
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ad Content -->
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="bi bi-pencil me-2"></i>Ad Content
              </h6>
            </div>
            <div class="card-body">
              <!-- Ad Name -->
              <div class="mb-3">
                <label for="adName" class="form-label fw-bold">
                  Ad Name <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="adName"
                  v-model="adForm.ad_name"
                  placeholder="Enter a descriptive name for your ad"
                  required
                >
              </div>

              <!-- Ad Text -->
              <div class="mb-3">
                <label for="adText" class="form-label fw-bold">
                  Ad Text <span class="text-danger">*</span>
                </label>
                <textarea
                  class="form-control"
                  id="adText"
                  v-model="adForm.ad_text"
                  rows="3"
                  placeholder="Write compelling ad copy that engages your audience"
                  maxlength="100"
                  required
                ></textarea>
                <div class="form-text">
                  {{ adForm.ad_text ? adForm.ad_text.length : 0 }}/100 characters
                </div>
              </div>

              <!-- Landing Page URL -->
              <div class="mb-3">
                <label for="landingPageUrl" class="form-label fw-bold">
                  Landing Page URL <span class="text-danger">*</span>
                </label>
                <input
                  type="url"
                  class="form-control"
                  id="landingPageUrl"
                  v-model="adForm.landing_page_url"
                  placeholder="https://your-website.com/landing-page"
                  required
                >
              </div>

              <!-- Display Name -->
              <div class="mb-3">
                <label for="displayName" class="form-label fw-bold">
                  Display Name
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="displayName"
                  v-model="adForm.display_name"
                  placeholder="Brand or app name to display in the ad"
                  maxlength="25"
                >
                <div class="form-text">
                  {{ adForm.display_name ? adForm.display_name.length : 0 }}/25 characters
                </div>
              </div>

              <!-- Call to Action -->
              <div class="mb-3">
                <label for="callToAction" class="form-label fw-bold">
                  Call to Action <span class="text-danger">*</span>
                </label>
                <select
                  class="form-select"
                  id="callToAction"
                  v-model="adForm.call_to_action"
                  required
                >
                  <option value="">Select a call to action</option>
                  <option value="LEARN_MORE">Learn More</option>
                  <option value="SHOP_NOW">Shop Now</option>
                  <option value="SIGN_UP">Sign Up</option>
                  <option value="DOWNLOAD">Download</option>
                  <option value="BOOK_NOW">Book Now</option>
                  <option value="GET_OFFER">Get Offer</option>
                  <option value="CONTACT_US">Contact Us</option>
                  <option value="APPLY_NOW">Apply Now</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="bi bi-eye me-2"></i>Preview
              </h6>
            </div>
            <div class="card-body">
              <div class="ad-preview">
                <!-- Creative Preview -->
                <div v-if="selectedCreative" class="creative-preview mb-3">
                  <video 
                    :src="selectedCreative.preview_url || selectedCreative.video_url" 
                    class="img-fluid rounded"
                    controls
                    muted
                  ></video>
                </div>
                <div v-else class="creative-placeholder mb-3">
                  <i class="bi bi-camera-video display-6 text-muted"></i>
                  <p class="text-muted small">Select a video</p>
                </div>

                <!-- Text Preview -->
                <div class="text-preview">
                  <div class="ad-text mb-2">
                    {{ adForm.ad_text || 'Your ad text will appear here...' }}
                  </div>
                  <div class="display-name mb-2">
                    <strong>{{ adForm.display_name || 'Your Brand' }}</strong>
                  </div>
                  <button 
                    class="btn btn-primary btn-sm w-100"
                    :class="{ 'opacity-50': !adForm.call_to_action }"
                    disabled
                  >
                    {{ adForm.call_to_action ? adForm.call_to_action.replace('_', ' ') : 'Call to Action' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="d-flex justify-content-end mt-4">
        <button 
          type="submit"
          class="btn btn-success btn-lg"
          :disabled="creating || !isFormValid"
        >
          <div v-if="creating" class="spinner-border spinner-border-sm me-2" role="status"></div>
          <i v-else class="bi bi-plus-circle me-2"></i>
          {{ creating ? 'Creating Ad...' : 'Create Ad' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useTikTokStore } from '../../stores/tiktokStore'

export default {
  name: 'TikTokAdCreator',
  props: {
    adGroupId: {
      type: String,
      required: true
    },
    campaignId: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'ad-created', 'open-uploader'],
  setup(props, { emit }) {
    const store = useTikTokStore()
    
    // State
    const creating = ref(false)
    const creativesLoading = ref(false)
    const availableCreatives = ref([])
    const selectedCreative = ref(null)
    
    const adForm = ref({
      ad_name: '',
      ad_text: '',
      landing_page_url: '',
      display_name: '',
      call_to_action: '',
      creative_type: 'video',
      creative_id: ''
    })

    // Computed
    const selectedAdGroup = computed(() => {
      return store.adGroups.find(ag => ag.adgroup_id === props.adGroupId)
    })

    const isFormValid = computed(() => {
      return adForm.value.ad_name &&
             adForm.value.ad_text &&
             adForm.value.landing_page_url &&
             adForm.value.call_to_action &&
             adForm.value.creative_id
    })

    // Methods
    const loadCreatives = async () => {
      creativesLoading.value = true
      try {
        const response = await store.apiRequest('/tiktok/creative/media/list', 'GET', {
          access_token: store.accessToken,
          advertiser_id: store.selectedAdvertiserId
        })

        if (response.success) {
          availableCreatives.value = (response.data.data?.videos || response.data.videos || []).map(vid => ({
            id: vid.video_id,
            filename: vid.filename,
            preview_url: vid.preview_url,
            video_url: vid.video_url,
            size: vid.size
          }))
        }
      } catch (error) {
        console.error('Failed to load videos:', error)
        store.showError('Failed to load videos')
      } finally {
        creativesLoading.value = false
      }
    }

    const selectCreative = (creative) => {
      adForm.value.creative_id = creative.id
      selectedCreative.value = creative
    }

    const createAd = async () => {
      if (!isFormValid.value) {
        store.showError('Please fill in all required fields')
        return
      }

      creating.value = true
      try {
        console.log('Creating ad with adGroupId:', props.adGroupId)
        console.log('Using identity_id:', store.currentIdentityId)
        console.log('Creative type:', adForm.value.creative_type)
        
        // Create Custom Identity instead of searching for existing ones
        console.log('Creating Custom Identity for the ad...')
        
        // Upload video placeholder for identity profile image
        console.log('Uploading video placeholder for identity profile image...')
        let placeholderImageId = null
        
        try {
          const placeholderResponse = await store.apiRequest('/tiktok/creative/video-placeholder/upload', 'POST', {
            access_token: store.accessToken,
            advertiser_id: store.selectedAdvertiserId
          })
          
          console.log('Placeholder upload response:', placeholderResponse)
          
          if (placeholderResponse.success && placeholderResponse.data?.code === 0) {
            placeholderImageId = placeholderResponse.data?.data?.image_id || placeholderResponse.data?.image_id
            console.log('Video placeholder uploaded with ID:', placeholderImageId)
          } else {
            const errorCode = placeholderResponse.data?.code
            const errorMessage = placeholderResponse.data?.message || placeholderResponse.error
            
            if (errorCode === 40911) {
              console.warn('Duplicate placeholder name, but continuing anyway. Error:', errorMessage)
              // Try to continue without placeholder - this might still work
            } else {
              console.warn('Placeholder upload failed:', errorMessage)
            }
          }
        } catch (error) {
          console.warn('Placeholder upload error:', error)
        }
        
        // If placeholder upload failed, try to find existing images or continue without
        if (!placeholderImageId) {
          console.warn('Placeholder upload failed, trying to find existing images...')
          
          try {
            // Try to get existing images
            const imagesResponse = await store.apiRequest('/tiktok/creative/images/list', 'GET', {
              access_token: store.accessToken,
              advertiser_id: store.selectedAdvertiserId
            })
            
            if (imagesResponse.success && imagesResponse.data?.data?.images?.length > 0) {
              // Use the first available image
              placeholderImageId = imagesResponse.data.data.images[0].image_id
              console.log('Using existing image as placeholder:', placeholderImageId)
            } else {
              console.warn('No existing images found, creating ad without thumbnail')
              store.showError('Warning: Creating ad without thumbnail image - this might cause issues')
            }
          } catch (error) {
            console.warn('Failed to get existing images:', error)
            store.showError('Warning: Creating ad without thumbnail image - this might cause issues')
          }
        }
        
        // Prepare Custom Identity data
        const customIdentityData = {
          identity_name: `Ad Identity - ${adForm.value.ad_name}`,
          identity_type: 'CUSTOMIZED_USER',
          display_name: adForm.value.display_name || 'Brand Name'
        }
        
        // Only add profile_image if we have placeholderImageId
        if (placeholderImageId) {
          customIdentityData.profile_image = placeholderImageId
        }
        
        console.log('Custom Identity data:', customIdentityData)
        
        const identity = await store.createCustomIdentity(customIdentityData)
        console.log('Created Custom Identity:', identity)
        
        if (!identity) {
          store.showError('Failed to create Custom Identity. Please try again.')
          return
        }
        
        // Only video ads are supported
        console.log('Creating video ad with video_id:', adForm.value.creative_id)
        
        // Validate that we have video ID
        if (!adForm.value.creative_id) {
          store.showError('Video ID is required for ad creation')
          return
        }
        
        // Prepare creative object according to TikTok API specification
        const creative = {
          ad_name: adForm.value.ad_name,
          identity_id: identity.identity_id,
          identity_type: identity.identity_type || 'CUSTOMIZED_USER',
          ad_format: 'SINGLE_VIDEO',
          ad_text: adForm.value.ad_text,
          call_to_action: adForm.value.call_to_action,
          landing_page_url: adForm.value.landing_page_url,
          video_id: adForm.value.creative_id
        }
        
        // Only add image_ids if we have a placeholder image
        if (placeholderImageId) {
          creative.image_ids = [placeholderImageId]
          console.log('Using placeholder thumbnail:', placeholderImageId)
        } else {
          console.log('Creating ad without thumbnail image')
        }
        
        console.log('Creative object validation:')
        console.log('- video_id:', adForm.value.creative_id)
        console.log('- image_ids:', creative.image_ids)
        console.log('- identity_id:', identity.identity_id)
        
        // Add optional fields to creative
        if (adForm.value.display_name) {
          creative.display_name = adForm.value.display_name
        }
        
        // Prepare ad data according to TikTok API specification
        const adData = {
          adgroup_id: props.adGroupId,
          creatives: [creative]
        }

        console.log('Final adData object:', JSON.stringify(adData, null, 2))

        const response = await store.apiRequest('/tiktok/ads/create', 'POST', {
          access_token: store.accessToken,
          advertiser_id: store.selectedAdvertiserId,
          ad_data: adData
        })

        if (response.success && response.data?.code === 0) {
          store.showSuccess('Ad created successfully!')
          emit('ad-created', response.data.data)
          
          // Reset form
          adForm.value = {
            ad_name: '',
            ad_text: '',
            landing_page_url: '',
            display_name: '',
            call_to_action: '',
            creative_type: 'image',
            creative_id: ''
          }
          selectedCreative.value = null
        } else {
          const errorMessage = response.data?.message || response.error || 'Failed to create ad'
          store.showError(`Failed to create ad: ${errorMessage}`)
        }
      } catch (error) {
        console.error('Ad creation error:', error)
        store.showError(`Failed to create ad: ${error.message}`)
      } finally {
        creating.value = false
      }
    }

    // Watchers
    watch(() => adForm.value.creative_type, () => {
      adForm.value.creative_id = ''
      selectedCreative.value = null
      availableCreatives.value = []
    })

    // Lifecycle
    onMounted(() => {
      loadCreatives()
    })

    return {
      // State
      creating,
      creativesLoading,
      availableCreatives,
      selectedCreative,
      adForm,
      
      // Computed
      selectedAdGroup,
      isFormValid,
      
      // Methods
      loadCreatives,
      selectCreative,
      createAd
    }
  }
}
</script>

<style scoped>
.creative-selector {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.creative-selector:hover {
  border-color: #0d6efd;
  transform: scale(1.02);
}

.creative-selector.selected {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}

.creative-selector.recommended {
  border-color: #20c997;
  box-shadow: 0 0 0 0.1rem rgba(32, 201, 151, 0.15);
}

.creative-selector.warning {
  border-color: #ffc107;
  box-shadow: 0 0 0 0.1rem rgba(255, 193, 7, 0.15);
}

.creative-selector.selected.recommended {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.25);
}

.creative-selector.selected.warning {
  border-color: #fd7e14;
  box-shadow: 0 0 0 0.2rem rgba(253, 126, 20, 0.25);
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(25, 135, 84, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.creative-selector.selected .selection-overlay {
  opacity: 1;
}

.creative-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 0.5rem;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.creative-selector:hover .creative-info {
  transform: translateY(0);
}

.creative-placeholder {
  background-color: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ad-preview {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
}

.creative-preview {
  max-height: 300px;
  overflow: hidden;
  border-radius: 0.375rem;
}

.text-preview .ad-text {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #495057;
}

.text-preview .display-name {
  font-size: 0.8rem;
  color: #6c757d;
}
</style>