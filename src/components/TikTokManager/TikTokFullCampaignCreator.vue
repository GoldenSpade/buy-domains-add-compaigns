<template>
  <div class="full-campaign-creator">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1"><i class="bi bi-rocket me-2 text-primary"></i>Full Campaign Creator</h4>
        <p class="text-muted small mb-0">
          Complete TikTok campaign setup: Campaign → Ad Group → Creative → Ads → Launch
        </p>
        <!-- Selected Account Info -->
        <div v-if="store.selectedAdvertiserId" class="mt-2">
          <span class="badge bg-primary">
            <i class="bi bi-building me-1"></i>
            Account: {{ getSelectedAccountName() }}
          </span>
        </div>
      </div>
      <button
        class="btn btn-outline-secondary"
        @click="$emit('close')"
        :disabled="creationInProgress"
      >
        <i class="bi bi-x me-1"></i>Close
      </button>
    </div>

    <!-- Progress Steps -->
    <div class="progress-steps mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <div
          v-for="(step, index) in creationSteps"
          :key="index"
          class="progress-step"
          :class="{
            active: currentStep === index,
            completed: currentStep > index,
            disabled: currentStep < index,
          }"
        >
          <div class="step-circle">
            <i v-if="currentStep > index" class="bi bi-check"></i>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-label">{{ step.name }}</div>
        </div>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${(currentStep / (creationSteps.length - 1)) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="step-content">
      <!-- Step 1: Campaign Setup -->
      <div v-if="currentStep === 0" class="step-section">
        <div class="row g-4">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-megaphone me-2"></i>Campaign Configuration</h6>
              </div>
              <div class="card-body">
                <!-- Campaign Name -->
                <div class="mb-3">
                  <label for="campaignName" class="form-label fw-bold">
                    Campaign Name <span class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    id="campaignName"
                    v-model="campaignForm.campaign_name"
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <!-- Objective -->
                <div class="mb-3">
                  <label for="objective" class="form-label fw-bold">
                    Campaign Objective <span class="text-danger">*</span>
                  </label>
                  <select
                    class="form-select"
                    id="objective"
                    v-model="campaignForm.objective_type"
                    required
                  >
                    <option value="">Select objective</option>
                    <option value="TRAFFIC">Traffic - Website visits</option>
                    <option value="WEB_CONVERSIONS">Conversions</option>
                    <option value="REACH">Reach - Brand awareness</option>
                    <option value="ENGAGEMENT">Engagement</option>
                    <option value="VIDEO_VIEW">Video Views</option>
                  </select>
                </div>

                <!-- Budget -->
                <div class="row">
                  <div class="col-md-6">
                    <label for="budgetMode" class="form-label fw-bold">Budget Mode</label>
                    <select class="form-select" id="budgetMode" v-model="campaignForm.budget_mode">
                      <option value="BUDGET_MODE_DAILY">Daily Budget</option>
                      <option value="BUDGET_MODE_TOTAL">Total Budget</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label for="budget" class="form-label fw-bold">
                      Budget Amount <span class="text-danger">*</span>
                    </label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input
                        type="number"
                        class="form-control"
                        id="budget"
                        v-model.number="campaignForm.budget"
                        min="20"
                        step="1"
                        placeholder="20"
                        required
                      />
                    </div>
                    <div class="form-text">Minimum: $20</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Step 1 Info</h6>
              </div>
              <div class="card-body">
                <p class="small text-muted mb-3">Set up the basic campaign structure and budget.</p>
                <ul class="small text-muted list-unstyled">
                  <li>
                    <i class="bi bi-check-circle text-success me-1"></i> Choose campaign objective
                  </li>
                  <li>
                    <i class="bi bi-check-circle text-success me-1"></i> Set budget parameters
                  </li>
                  <li>
                    <i class="bi bi-check-circle text-success me-1"></i> Configure basic settings
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Ad Group Setup -->
      <div v-if="currentStep === 1" class="step-section">
        <div class="row g-4">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-collection me-2"></i>Ad Group Configuration</h6>
              </div>
              <div class="card-body">
                <!-- Ad Group Name -->
                <div class="mb-3">
                  <label for="adGroupName" class="form-label fw-bold">
                    Ad Group Name <span class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    class="form-control"
                    id="adGroupName"
                    v-model="adGroupForm.adgroup_name"
                    placeholder="Enter ad group name"
                    required
                  />
                </div>

                <!-- Targeting -->
                <div class="mb-3">
                  <label class="form-label fw-bold"
                    >Target Countries <span class="text-danger">*</span></label
                  >
                  <div v-if="adGroupMetadataLoading" class="text-center py-3">
                    <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                    <small class="text-muted">Loading countries...</small>
                  </div>
                  <div v-else>
                    <select class="form-select" multiple v-model="adGroupForm.locations" size="4">
                      <option
                        v-for="location in availableLocations"
                        :key="location.location_id"
                        :value="location.location_id"
                      >
                        {{ location.name }}
                      </option>
                    </select>
                    <div class="form-text">Hold Ctrl/Cmd to select multiple countries</div>
                  </div>
                </div>

                <!-- Optimization Goal -->
                <div class="mb-3">
                  <label for="optimizationGoal" class="form-label fw-bold">
                    Optimization Goal <span class="text-danger">*</span>
                  </label>
                  <select
                    class="form-select"
                    id="optimizationGoal"
                    v-model="adGroupForm.optimization_goal"
                    required
                  >
                    <option value="">Select optimization goal</option>
                    <option value="CLICK">Clicks</option>
                    <option value="REACH">Reach</option>
                    <option value="IMPRESSION">Impressions</option>
                    <option value="CONVERSION">Conversions</option>
                  </select>
                </div>

                <!-- Bid Strategy -->
                <div class="row">
                  <div class="col-md-6">
                    <label for="bidType" class="form-label fw-bold">Bid Type</label>
                    <select class="form-select" id="bidType" v-model="adGroupForm.bid_type">
                      <option value="BID_TYPE_NO_BID">Automatic Bidding</option>
                      <option value="BID_TYPE_CUSTOM">Manual Bidding</option>
                    </select>
                  </div>
                  <div class="col-md-6" v-if="adGroupForm.bid_type === 'BID_TYPE_CUSTOM'">
                    <label for="bid" class="form-label fw-bold">Bid Amount</label>
                    <div class="input-group">
                      <span class="input-group-text">$</span>
                      <input
                        type="number"
                        class="form-control"
                        id="bid"
                        v-model.number="adGroupForm.bid"
                        min="0.01"
                        step="0.01"
                        placeholder="1.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="bi bi-info-circle me-2"></i>Step 2 Info</h6>
              </div>
              <div class="card-body">
                <p class="small text-muted mb-3">
                  Configure targeting and optimization settings for your ad group.
                </p>
                <ul class="small text-muted list-unstyled">
                  <li>
                    <i class="bi bi-check-circle text-success me-1"></i> Set geographic targeting
                  </li>
                  <li>
                    <i class="bi bi-check-circle text-success me-1"></i> Choose optimization goal
                  </li>
                  <li>
                    <i class="bi bi-check-circle text-success me-1"></i> Configure bid strategy
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Creative Upload -->
      <div v-if="currentStep === 2" class="step-section">
        <TikTokCreativeUploader @close="goToNextStep" @media-uploaded="onMediaUploaded" />
      </div>

      <!-- Step 4: Ad Creation -->
      <div v-if="currentStep === 3" class="step-section">
        <TikTokAdCreator
          v-if="createdAdGroupId"
          :ad-group-id="createdAdGroupId"
          :campaign-id="createdCampaignId"
          @close="goToNextStep"
          @ad-created="onAdCreated"
          @open-uploader="goToPreviousStep"
        />
        <div v-else class="text-center py-5">
          <div class="spinner-border" role="status"></div>
          <p class="mt-2 text-muted">Waiting for ad group creation...</p>
        </div>
      </div>

      <!-- Step 5: Review & Launch -->
      <div v-if="currentStep === 4" class="step-section">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0"><i class="bi bi-eye me-2"></i>Campaign Review</h6>
          </div>
          <div class="card-body">
            <div class="row g-4">
              <div class="col-md-6">
                <h6>Campaign Details</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{{ campaignForm.campaign_name }}</td>
                    </tr>
                    <tr>
                      <td><strong>Objective:</strong></td>
                      <td>{{ campaignForm.objective_type }}</td>
                    </tr>
                    <tr>
                      <td><strong>Budget:</strong></td>
                      <td>
                        ${{ campaignForm.budget }} ({{
                          campaignForm.budget_mode === 'BUDGET_MODE_DAILY' ? 'Daily' : 'Total'
                        }})
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h6 class="mt-4">Ad Group Details</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Name:</strong></td>
                      <td>{{ adGroupForm.adgroup_name }}</td>
                    </tr>
                    <tr>
                      <td><strong>Optimization:</strong></td>
                      <td>{{ adGroupForm.optimization_goal }}</td>
                    </tr>
                    <tr>
                      <td><strong>Countries:</strong></td>
                      <td>{{ selectedCountriesNames.join(', ') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="col-md-6">
                <h6>Creation Summary</h6>
                <div class="creation-status">
                  <div class="status-item" :class="{ completed: createdCampaignId }">
                    <i
                      class="bi"
                      :class="
                        createdCampaignId ? 'bi-check-circle text-success' : 'bi-circle text-muted'
                      "
                    ></i>
                    Campaign {{ createdCampaignId ? 'Created' : 'Pending' }}
                  </div>
                  <div class="status-item" :class="{ completed: createdAdGroupId }">
                    <i
                      class="bi"
                      :class="
                        createdAdGroupId ? 'bi-check-circle text-success' : 'bi-circle text-muted'
                      "
                    ></i>
                    Ad Group {{ createdAdGroupId ? 'Created' : 'Pending' }}
                  </div>
                  <div class="status-item" :class="{ completed: uploadedMedia.length > 0 }">
                    <i
                      class="bi"
                      :class="
                        uploadedMedia.length > 0
                          ? 'bi-check-circle text-success'
                          : 'bi-circle text-muted'
                      "
                    ></i>
                    Media
                    {{
                      uploadedMedia.length > 0 ? `Uploaded (${uploadedMedia.length})` : 'Pending'
                    }}
                  </div>
                  <div class="status-item" :class="{ completed: createdAds.length > 0 }">
                    <i
                      class="bi"
                      :class="
                        createdAds.length > 0
                          ? 'bi-check-circle text-success'
                          : 'bi-circle text-muted'
                      "
                    ></i>
                    Ads {{ createdAds.length > 0 ? `Created (${createdAds.length})` : 'Pending' }}
                  </div>
                </div>

                <!-- Launch Campaign -->
                <div class="mt-4">
                  <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    Ready to launch your campaign? This will activate all components and start
                    serving ads.
                  </div>
                  <button
                    class="btn btn-success btn-lg w-100"
                    @click="launchCampaign"
                    :disabled="launchingCampaign || !isReadyToLaunch"
                  >
                    <div
                      v-if="launchingCampaign"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></div>
                    <i v-else class="bi bi-rocket-takeoff me-2"></i>
                    {{ launchingCampaign ? 'Launching Campaign...' : 'Launch Campaign' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="d-flex justify-content-between mt-4">
      <button
        class="btn btn-outline-secondary"
        @click="goToPreviousStep"
        :disabled="currentStep === 0 || creationInProgress"
      >
        <i class="bi bi-arrow-left me-1"></i>Previous
      </button>

      <button
        class="btn btn-primary"
        @click="goToNextStep"
        :disabled="!canProceedToNextStep || creationInProgress"
        v-if="currentStep < creationSteps.length - 1"
      >
        <div
          v-if="creationInProgress"
          class="spinner-border spinner-border-sm me-2"
          role="status"
        ></div>
        Next<i class="bi bi-arrow-right ms-1"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useTikTokStore } from '../../stores/tiktokStore'
import TikTokCreativeUploader from './TikTokCreativeUploader.vue'
import TikTokAdCreator from './TikTokAdCreator.vue'

export default {
  name: 'TikTokFullCampaignCreator',
  components: {
    TikTokCreativeUploader,
    TikTokAdCreator,
  },
  emits: ['close', 'campaign-launched'],
  setup(props, { emit }) {
    const store = useTikTokStore()

    // State
    const currentStep = ref(0)
    const creationInProgress = ref(false)
    const launchingCampaign = ref(false)

    // Created entities
    const createdCampaignId = ref('')
    const createdAdGroupId = ref('')
    const uploadedMedia = ref([])
    const createdAds = ref([])

    // Forms
    const campaignForm = ref({
      campaign_name: '',
      objective_type: 'TRAFFIC',
      budget_mode: 'BUDGET_MODE_DAILY',
      budget: 20,
      rf_campaign_type: 'STANDARD',
    })

    const adGroupForm = ref({
      adgroup_name: '',
      locations: [],
      optimization_goal: 'CLICK',
      bid_type: 'BID_TYPE_NO_BID',
      bid: 1.0,
      placements: ['PLACEMENT_TIKTOK'],
    })

    // Step configuration
    const creationSteps = [
      { name: 'Campaign Setup', component: 'campaign' },
      { name: 'Ad Group Setup', component: 'adgroup' },
      { name: 'Upload Creative', component: 'creative' },
      { name: 'Create Ads', component: 'ads' },
      { name: 'Review & Launch', component: 'review' },
    ]

    // Computed
    const availableLocations = computed(() => {
      return store.adGroupMetadata.locations || []
    })

    const selectedCountriesNames = computed(() => {
      return adGroupForm.value.locations.map((locationId) => {
        const location = availableLocations.value.find((loc) => loc.location_id === locationId)
        return location ? location.name : locationId
      })
    })

    const adGroupMetadataLoading = computed(() => store.adGroupMetadataLoading)

    const canProceedToNextStep = computed(() => {
      switch (currentStep.value) {
        case 0: // Campaign setup
          return (
            campaignForm.value.campaign_name &&
            campaignForm.value.objective_type &&
            campaignForm.value.budget >= 20
          )
        case 1: // Ad Group setup
          return (
            adGroupForm.value.adgroup_name &&
            adGroupForm.value.locations.length > 0 &&
            adGroupForm.value.optimization_goal
          )
        case 2: // Creative upload
          return uploadedMedia.value.length > 0
        case 3: // Ad creation
          return createdAds.value.length > 0
        default:
          return true
      }
    })

    const isReadyToLaunch = computed(() => {
      return (
        createdCampaignId.value &&
        createdAdGroupId.value &&
        uploadedMedia.value.length > 0 &&
        createdAds.value.length > 0
      )
    })

    // Methods
    const getSelectedAccountName = () => {
      if (!store.advertisers || !store.selectedAdvertiserId) return 'Unknown'
      const advertiser = store.advertisers.find(
        (adv) => adv.advertiser_id === store.selectedAdvertiserId
      )
      return advertiser ? advertiser.advertiser_name : 'Unknown'
    }

    const goToNextStep = async () => {
      if (currentStep.value === 0) {
        // Create campaign
        await createCampaign()
      } else if (currentStep.value === 1) {
        // Create ad group
        await createAdGroup()
      }

      if (currentStep.value < creationSteps.length - 1) {
        currentStep.value++
      }
    }

    const goToPreviousStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--
      }
    }

    const createCampaign = async () => {
      creationInProgress.value = true
      try {
        const campaignData = {
          ...campaignForm.value,
        }

        const result = await store.createCampaign(campaignData)
        if (result) {
          // Find the created campaign
          const campaign = store.campaigns.find(
            (c) => c.campaign_name === campaignForm.value.campaign_name
          )
          if (campaign) {
            createdCampaignId.value = campaign.campaign_id
          }
        }
      } finally {
        creationInProgress.value = false
      }
    }

    const createAdGroup = async () => {
      if (!createdCampaignId.value) {
        store.showError('Campaign must be created first')
        return
      }

      creationInProgress.value = true
      try {
        const adGroupData = {
          campaign_id: createdCampaignId.value,
          adgroup_name: adGroupForm.value.adgroup_name,
          optimization_goal: adGroupForm.value.optimization_goal,
          bid_type: adGroupForm.value.bid_type,
          placements: adGroupForm.value.placements,
          location_ids: adGroupForm.value.locations,
          age_groups: ['AGE_25_34', 'AGE_35_44'], // Default age groups
          genders: ['GENDER_MALE', 'GENDER_FEMALE'], // Both genders
        }

        if (adGroupForm.value.bid_type === 'BID_TYPE_CUSTOM') {
          adGroupData.bid = adGroupForm.value.bid
        }

        const result = await store.createAdGroup(adGroupData)
        if (result) {
          // Find the created ad group
          await store.getAdGroups(createdCampaignId.value)
          const adGroup = store.adGroups.find(
            (ag) => ag.adgroup_name === adGroupForm.value.adgroup_name
          )
          if (adGroup) {
            createdAdGroupId.value = adGroup.adgroup_id
          }
        }
      } finally {
        creationInProgress.value = false
      }
    }

    const onMediaUploaded = (mediaData) => {
      uploadedMedia.value.push(mediaData)
    }

    const onAdCreated = (adData) => {
      createdAds.value.push(adData)
    }

    const launchCampaign = async () => {
      if (!isReadyToLaunch.value) {
        store.showError('Campaign is not ready to launch')
        return
      }

      launchingCampaign.value = true
      try {
        const result = await store.finalizeCampaign(createdCampaignId.value)
        if (result) {
          store.showSuccess('Campaign launched successfully!')
          emit('campaign-launched', {
            campaignId: createdCampaignId.value,
            adGroupId: createdAdGroupId.value,
            adsCount: createdAds.value.length,
          })
          emit('close')
        }
      } finally {
        launchingCampaign.value = false
      }
    }

    // Load metadata when component mounts
    onMounted(async () => {
      await store.getCampaignMetadata()
      await store.getAdGroupMetadata()
    })

    // Auto-populate ad group name based on campaign name
    watch(
      () => campaignForm.value.campaign_name,
      (newName) => {
        if (newName && !adGroupForm.value.adgroup_name) {
          adGroupForm.value.adgroup_name = `${newName} - Ad Group 1`
        }
      }
    )

    return {
      // State
      currentStep,
      creationInProgress,
      launchingCampaign,
      createdCampaignId,
      createdAdGroupId,
      uploadedMedia,
      createdAds,

      // Forms
      campaignForm,
      adGroupForm,

      // Configuration
      creationSteps,

      // Computed
      availableLocations,
      selectedCountriesNames,
      adGroupMetadataLoading,
      canProceedToNextStep,
      isReadyToLaunch,

      // Methods
      getSelectedAccountName,
      goToNextStep,
      goToPreviousStep,
      onMediaUploaded,
      onAdCreated,
      launchCampaign,

      // Store
      store,
    }
  },
}
</script>

<style scoped>
.progress-steps {
  position: relative;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e9ecef;
  border: 2px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.progress-step.active .step-circle {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.progress-step.completed .step-circle {
  background-color: #198754;
  border-color: #198754;
  color: white;
}

.step-label {
  font-size: 0.85rem;
  text-align: center;
  color: #6c757d;
  font-weight: 500;
}

.progress-step.active .step-label {
  color: #0d6efd;
  font-weight: 600;
}

.progress-step.completed .step-label {
  color: #198754;
}

.progress-bar {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e9ecef;
  z-index: 1;
}

.progress-fill {
  height: 100%;
  background-color: #198754;
  transition: width 0.5s ease;
}

.step-content {
  min-height: 400px;
  padding: 2rem 0;
}

.creation-status .status-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.creation-status .status-item.completed {
  color: #198754;
}

.creation-status .status-item i {
  margin-right: 0.5rem;
  font-size: 1.1rem;
}
</style>
