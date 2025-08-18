<template>
  <div v-if="shouldShowCampaignManager" class="mt-3">
    <!-- Campaign Management Card -->
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="bi bi-megaphone me-2"></i>Campaign Management</h5>
              <div class="text-muted fw-bold small d-none d-md-block">Account: {{ getSelectedAccountName() }}</div>
              <div class="text-muted fw-bold d-block d-md-none" style="font-size: 0.75rem;">{{ getSelectedAccountName() }}</div>
            </div>
          </div>

          <div class="card-body p-0">
            <!-- Campaign Overview Accordion -->
            <div class="accordion accordion-flush" id="campaignAccordion">
              <!-- Overview Section -->
              <div class="accordion-item">
                <h2 class="accordion-header" id="overviewHeader">
                  <button
                    class="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#overviewCollapse"
                    aria-expanded="true"
                    aria-controls="overviewCollapse"
                  >
                    <i class="bi bi-bar-chart me-2"></i>
                    Campaign Overview
                  </button>
                </h2>
                <div
                  id="overviewCollapse"
                  class="accordion-collapse collapse show"
                  aria-labelledby="overviewHeader"
                  data-bs-parent="#campaignAccordion"
                >
                  <div class="accordion-body">
                    <!-- Quick Stats -->
                    <div class="row g-2 mb-4">
                      <div class="col-md-3 col-6">
                        <div class="card bg-light h-100">
                          <div class="card-body text-center stat-card-body">
                            <h6 class="stat-title">Active</h6>
                            <h4 class="stat-number">{{ campaignStats.active || 0 }}</h4>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-3 col-6">
                        <div class="card bg-light h-100">
                          <div class="card-body text-center stat-card-body">
                            <h6 class="stat-title">Spend</h6>
                            <h4 class="stat-number">${{ campaignStats.totalSpend || '0.00' }}</h4>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-3 col-6">
                        <div class="card bg-light h-100">
                          <div class="card-body text-center stat-card-body">
                            <h6 class="stat-title">Views</h6>
                            <h4 class="stat-number">
                              {{ formatNumber(campaignStats.impressions) || '0' }}
                            </h4>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-3 col-6">
                        <div class="card bg-light h-100">
                          <div class="card-body text-center stat-card-body">
                            <h6 class="stat-title">Clicks</h6>
                            <h4 class="stat-number">{{ formatNumber(campaignStats.clicks) || '0' }}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Recent Campaigns -->
                    <div class="campaigns-header">
                      <div class="campaigns-title-section">
                        <h6 class="mb-0">Recent Campaigns</h6>
                        <button 
                          class="btn btn-outline-primary btn-sm refresh-btn"
                          @click="refreshCampaignData"
                          :disabled="store.campaignLoading"
                          title="Refresh campaigns"
                        >
                          <i 
                            class="bi" 
                            :class="store.campaignLoading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'"
                          ></i>
                        </button>
                      </div>
                      <button class="btn btn-primary btn-sm create-campaign-btn" @click="openCreateCampaign">
                        <i class="bi bi-plus me-1 d-none d-sm-inline"></i>
                        <span class="d-none d-sm-inline">Create Campaign</span>
                        <span class="d-inline d-sm-none">Create</span>
                      </button>
                    </div>

                    <!-- Loading indicator -->
                    <div v-if="store.campaignLoading" class="text-center py-3">
                      <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                      <div class="small text-muted">Loading campaigns...</div>
                    </div>

                    <!-- Campaigns List -->
                    <div v-else-if="campaigns.length > 0" class="list-group">
                      <div
                        v-for="campaign in recentCampaigns"
                        :key="campaign.campaign_id"
                        class="list-group-item"
                      >
                        <div class="campaign-item-wrapper">
                          <div class="campaign-info">
                            <h6 class="campaign-name">{{ campaign.campaign_name }}</h6>
                            <div class="campaign-details">
                              <span class="campaign-budget">Budget: ${{ campaign.budget }}</span>
                              <span class="campaign-separator">|</span>
                              <span class="campaign-status">
                                Status: <span :class="getCampaignStatusClass(campaign.operation_status)">
                                  {{ campaign.operation_status }}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div class="campaign-actions">
                            <button 
                              class="btn btn-outline-success btn-sm campaign-btn" 
                              title="Start"
                              @click="startCampaign(campaign.campaign_id)"
                              :disabled="campaign.operation_status === 'ENABLE' || store.loading"
                            >
                              <i class="bi bi-play"></i>
                            </button>
                            <button 
                              class="btn btn-outline-secondary btn-sm campaign-btn" 
                              title="Pause"
                              @click="pauseCampaign(campaign.campaign_id)"
                              :disabled="campaign.operation_status !== 'ENABLE' || store.loading"
                            >
                              <i class="bi bi-pause"></i>
                            </button>
                            <button 
                              class="btn btn-outline-primary btn-sm campaign-btn" 
                              title="Edit"
                              :disabled="store.loading"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button 
                              class="btn btn-outline-danger btn-sm campaign-btn" 
                              title="Delete"
                              @click="deleteCampaign(campaign.campaign_id, campaign.campaign_name)"
                              :disabled="store.loading"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div v-else-if="!store.campaignLoading" class="text-center py-4">
                      <i class="bi bi-megaphone-fill text-muted" style="font-size: 3rem"></i>
                      <h6 class="text-muted mt-3">No campaigns yet</h6>
                      <p class="text-muted small mb-3">
                        Create your first campaign to start advertising
                      </p>
                      <button class="btn btn-primary" @click="openCreateCampaign">
                        <i class="bi bi-plus me-1"></i>Create Your First Campaign
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Campaign Creator Section -->
              <div class="accordion-item">
                <h2 class="accordion-header" id="creatorHeader">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#creatorCollapse"
                    aria-expanded="false"
                    aria-controls="creatorCollapse"
                  >
                    <i class="bi bi-plus-circle me-2"></i>
                    Create Campaign
                  </button>
                </h2>
                <div
                  id="creatorCollapse"
                  class="accordion-collapse collapse"
                  aria-labelledby="creatorHeader"
                  data-bs-parent="#campaignAccordion"
                >
                  <div class="accordion-body">
                    <!-- Campaign Creation Form -->
                    <div class="campaign-creation-form">
                      <div class="row">
                        <div class="col-12">
                          <h6 class="mb-3">
                            <i class="bi bi-plus-circle me-2"></i>Create New Campaign
                          </h6>
                        </div>
                      </div>

                      <form @submit.prevent="handleCreateCampaign">
                        <div class="row g-3">
                          <!-- Campaign Name -->
                          <div class="col-12">
                            <label for="campaignName" class="form-label">
                              Campaign Name <span class="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              class="form-control"
                              id="campaignName"
                              v-model="campaignForm.campaign_name"
                              placeholder="Enter campaign name"
                              :class="{ 'is-invalid': campaignFormErrors.campaign_name }"
                              required
                            >
                            <div v-if="campaignFormErrors.campaign_name" class="invalid-feedback">
                              {{ campaignFormErrors.campaign_name }}
                            </div>
                          </div>

                          <!-- Campaign Objective -->
                          <div class="col-md-6 col-12">
                            <label for="objectiveType" class="form-label">
                              Campaign Objective <span class="text-danger">*</span>
                            </label>
                            <select
                              class="form-select"
                              id="objectiveType"
                              v-model="campaignForm.objective_type"
                              :class="{ 'is-invalid': campaignFormErrors.objective_type }"
                              required
                            >
                              <option value="">Select objective</option>
                              <option value="REACH">Brand Awareness (Reach)</option>
                              <option value="TRAFFIC">Website Traffic</option>
                              <option value="APP_PROMOTION">App Promotion</option>
                              <option value="CONVERSIONS">Conversions</option>
                              <option value="LEAD_GENERATION">Lead Generation</option>
                              <option value="ENGAGEMENT">Engagement</option>
                            </select>
                            <div v-if="campaignFormErrors.objective_type" class="invalid-feedback">
                              {{ campaignFormErrors.objective_type }}
                            </div>
                          </div>

                          <!-- Budget Mode -->
                          <div class="col-md-6 col-12">
                            <label for="budgetMode" class="form-label">
                              Budget Type <span class="text-danger">*</span>
                            </label>
                            <select
                              class="form-select"
                              id="budgetMode"
                              v-model="campaignForm.budget_mode"
                              :class="{ 'is-invalid': campaignFormErrors.budget_mode }"
                              required
                            >
                              <option value="">Select budget type</option>
                              <option value="BUDGET_MODE_DAY">Daily Budget</option>
                              <option value="BUDGET_MODE_TOTAL">Lifetime Budget</option>
                            </select>
                            <div v-if="campaignFormErrors.budget_mode" class="invalid-feedback">
                              {{ campaignFormErrors.budget_mode }}
                            </div>
                          </div>

                          <!-- Budget Amount -->
                          <div class="col-md-6 col-12">
                            <label for="budget" class="form-label">
                              Budget Amount ($) <span class="text-danger">*</span>
                            </label>
                            <div class="input-group">
                              <span class="input-group-text">$</span>
                              <input
                                type="number"
                                class="form-control"
                                id="budget"
                                v-model.number="campaignForm.budget"
                                placeholder="50.00"
                                min="20"
                                step="0.01"
                                :class="{ 'is-invalid': campaignFormErrors.budget }"
                                required
                              >
                            </div>
                            <div v-if="campaignFormErrors.budget" class="invalid-feedback">
                              {{ campaignFormErrors.budget }}
                            </div>
                            <div class="form-text">
                              {{ campaignForm.budget_mode === 'BUDGET_MODE_DAY' ? 'Daily' : 'Total lifetime' }} budget minimum: $20
                            </div>
                          </div>

                          <!-- App Promotion Type (conditional) -->
                          <div v-if="campaignForm.objective_type === 'APP_PROMOTION'" class="col-md-6 col-12">
                            <label for="appPromotionType" class="form-label">
                              App Promotion Type <span class="text-danger">*</span>
                            </label>
                            <select
                              class="form-select"
                              id="appPromotionType"
                              v-model="campaignForm.app_promotion_type"
                              :class="{ 'is-invalid': campaignFormErrors.app_promotion_type }"
                              required
                            >
                              <option value="">Select promotion type</option>
                              <option value="APP_INSTALL">App Installs</option>
                              <option value="APP_RETARGETING">App Retargeting</option>
                            </select>
                            <div v-if="campaignFormErrors.app_promotion_type" class="invalid-feedback">
                              {{ campaignFormErrors.app_promotion_type }}
                            </div>
                          </div>

                          <!-- Campaign Description (optional) -->
                          <div class="col-12">
                            <label for="campaignDescription" class="form-label">
                              Campaign Description <span class="text-muted">(Optional)</span>
                            </label>
                            <textarea
                              class="form-control"
                              id="campaignDescription"
                              v-model="campaignForm.description"
                              rows="3"
                              placeholder="Describe your campaign goals and target audience..."
                            ></textarea>
                          </div>

                          <!-- Form Actions -->
                          <div class="col-12">
                            <div class="d-flex gap-2 pt-3">
                              <button
                                type="submit"
                                class="btn btn-primary"
                                :disabled="isCreatingCampaign || !isFormValid"
                              >
                                <div v-if="isCreatingCampaign" class="spinner-border spinner-border-sm me-2" role="status"></div>
                                <i v-else class="bi bi-plus me-2"></i>
                                {{ isCreatingCampaign ? 'Creating...' : 'Create Campaign' }}
                              </button>
                              <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="resetCampaignForm"
                                :disabled="isCreatingCampaign"
                              >
                                <i class="bi bi-arrow-clockwise me-2"></i>Reset
                              </button>
                            </div>
                          </div>

                          <!-- Success/Error Messages -->
                          <div v-if="campaignCreationMessage" class="col-12">
                            <div 
                              class="alert mt-3"
                              :class="campaignCreationSuccess ? 'alert-success' : 'alert-danger'"
                            >
                              <i 
                                class="bi me-2"
                                :class="campaignCreationSuccess ? 'bi-check-circle' : 'bi-exclamation-triangle'"
                              ></i>
                              {{ campaignCreationMessage }}
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Active Campaigns Management Section -->
              <div class="accordion-item">
                <h2 class="accordion-header" id="managementHeader">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#managementCollapse"
                    aria-expanded="false"
                    aria-controls="managementCollapse"
                  >
                    <i class="bi bi-gear me-2"></i>
                    Campaign Management
                  </button>
                </h2>
                <div
                  id="managementCollapse"
                  class="accordion-collapse collapse"
                  aria-labelledby="managementHeader"
                  data-bs-parent="#campaignAccordion"
                >
                  <div class="accordion-body">
                    <div class="text-center py-4">
                      <i class="bi bi-sliders text-muted" style="font-size: 3rem"></i>
                      <h6 class="text-muted mt-3">Advanced Management</h6>
                      <p class="text-muted">
                        Coming soon - Bulk operations, advanced editing, and detailed analytics
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useTikTokStore } from '@/stores/tiktokStore'

const store = useTikTokStore()

// Use store data directly
const campaigns = computed(() => store.campaigns)
const campaignStats = computed(() => store.campaignStats)

// Campaign creation form data
const campaignForm = ref({
  campaign_name: '',
  objective_type: '',
  budget_mode: '',
  budget: 50,
  app_promotion_type: '',
  description: ''
})

const campaignFormErrors = ref({})
const isCreatingCampaign = ref(false)
const campaignCreationMessage = ref('')
const campaignCreationSuccess = ref(false)

// Computed properties
const shouldShowCampaignManager = computed(() => {
  return store.isAuthenticated && store.selectedAdvertiserId
})

const recentCampaigns = computed(() => {
  return campaigns.value.slice(0, 5) // Show only 5 most recent
})

// Form validation
const isFormValid = computed(() => {
  const form = campaignForm.value
  const hasRequiredFields = form.campaign_name && 
                           form.objective_type && 
                           form.budget_mode && 
                           form.budget >= 20
  
  // If APP_PROMOTION is selected, app_promotion_type is required
  if (form.objective_type === 'APP_PROMOTION') {
    return hasRequiredFields && form.app_promotion_type
  }
  
  return hasRequiredFields
})

// Константы
const ADMIN_ADVERTISER_ID = '7524260058755170320'

// Проверка является ли аккаунт администраторским
const isAdminAccount = (account) => {
  return account.advertiser_id === ADMIN_ADVERTISER_ID || 
         account.name === 'News World One' || 
         account.company === 'News World One'
}

// Methods
const getSelectedAccountName = () => {
  if (!store.advertisers?.data?.list) return 'Unknown'

  const account = store.advertisers.data.list.find(
    (acc) => acc.advertiser_id === store.selectedAdvertiserId
  )

  if (!account) return store.selectedAdvertiserId
  
  // Проверяем по ID или по содержимому полей name/company
  if (isAdminAccount(account)) {
    return 'Admin'
  }
  
  return account?.name || account?.advertiser_name || store.selectedAdvertiserId
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const getCampaignStatusClass = (status) => {
  const statusClasses = {
    ENABLE: 'text-success',
    PAUSED: 'text-warning',
    DISABLE: 'text-danger',
    PENDING: 'text-info',
  }
  return statusClasses[status] || 'text-muted'
}

const openCreateCampaign = () => {
  // Открыть аккордеон создания кампании
  const createAccordion = document.getElementById('creatorCollapse')
  if (createAccordion && !createAccordion.classList.contains('show')) {
    const createButton = document.querySelector('[data-bs-target="#creatorCollapse"]')
    createButton?.click()
  }
}

// Methods for campaign actions
const startCampaign = async (campaignId) => {
  const success = await store.updateCampaignStatus(campaignId, 'ENABLE')
  if (success) {
    console.log('Campaign started successfully')
  }
}

const pauseCampaign = async (campaignId) => {
  const success = await store.updateCampaignStatus(campaignId, 'DISABLE')
  if (success) {
    console.log('Campaign paused successfully')
  }
}

const deleteCampaign = async (campaignId, campaignName) => {
  // Показываем конфирмацию
  const confirmed = confirm(`Are you sure you want to delete the campaign "${campaignName}"?\n\nThis action cannot be undone.`)
  
  if (confirmed) {
    const success = await store.updateCampaignStatus(campaignId, 'DELETE')
    if (success) {
      console.log('Campaign deleted successfully')
      
      // Удаляем кампанию из локального списка сразу
      store.campaigns = store.campaigns.filter(c => c.campaign_id !== campaignId)
      
      // Обновляем статистику
      store.campaignStats.active = store.campaigns.filter(c => c.operation_status === 'ENABLE').length
      
      // Показываем уведомление
      alert(`Campaign "${campaignName}" has been deleted successfully.`)
    } else {
      alert(`Failed to delete campaign "${campaignName}". Please try again.`)
    }
  }
}

const refreshCampaignData = async () => {
  if (store.selectedAdvertiserId) {
    await store.loadCampaignData()
  }
}

// Campaign creation methods
const validateCampaignForm = () => {
  const errors = {}
  const form = campaignForm.value

  // Campaign name validation
  if (!form.campaign_name.trim()) {
    errors.campaign_name = 'Campaign name is required'
  } else if (form.campaign_name.length < 3) {
    errors.campaign_name = 'Campaign name must be at least 3 characters'
  } else if (form.campaign_name.length > 512) {
    errors.campaign_name = 'Campaign name must be less than 512 characters'
  }

  // Objective type validation
  if (!form.objective_type) {
    errors.objective_type = 'Campaign objective is required'
  }

  // Budget mode validation
  if (!form.budget_mode) {
    errors.budget_mode = 'Budget type is required'
  }

  // Budget validation
  if (!form.budget || form.budget < 20) {
    errors.budget = 'Budget must be at least $20'
  } else if (form.budget > 999999) {
    errors.budget = 'Budget cannot exceed $999,999'
  }

  // App promotion type validation
  if (form.objective_type === 'APP_PROMOTION' && !form.app_promotion_type) {
    errors.app_promotion_type = 'App promotion type is required for app promotion campaigns'
  }

  campaignFormErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleCreateCampaign = async () => {
  // Reset previous messages
  campaignCreationMessage.value = ''
  campaignCreationSuccess.value = false

  // Validate form
  if (!validateCampaignForm()) {
    campaignCreationMessage.value = 'Please fix the form errors before submitting'
    campaignCreationSuccess.value = false
    return
  }

  isCreatingCampaign.value = true

  try {
    // Prepare campaign data for API
    const campaignData = {
      campaign_name: campaignForm.value.campaign_name.trim(),
      objective_type: campaignForm.value.objective_type,
      budget_mode: campaignForm.value.budget_mode,
      budget: campaignForm.value.budget
    }

    // Add app promotion type if needed
    if (campaignForm.value.objective_type === 'APP_PROMOTION' && campaignForm.value.app_promotion_type) {
      campaignData.app_promotion_type = campaignForm.value.app_promotion_type
    }

    console.log('Creating campaign with data:', campaignData)

    // Call store method to create campaign
    const success = await store.createCampaign(campaignData)

    if (success) {
      campaignCreationMessage.value = `Campaign "${campaignData.campaign_name}" created successfully!`
      campaignCreationSuccess.value = true
      
      // Reset form after successful creation
      setTimeout(() => {
        resetCampaignForm()
        campaignCreationMessage.value = ''
        
        // Close the accordion section
        const overviewAccordion = document.getElementById('overviewCollapse')
        if (overviewAccordion && !overviewAccordion.classList.contains('show')) {
          const overviewButton = document.querySelector('[data-bs-target="#overviewCollapse"]')
          overviewButton?.click()
        }
      }, 3000)
    } else {
      campaignCreationMessage.value = store.error || 'Failed to create campaign. Please try again.'
      campaignCreationSuccess.value = false
    }
  } catch (error) {
    console.error('Error creating campaign:', error)
    campaignCreationMessage.value = error.message || 'An unexpected error occurred while creating the campaign.'
    campaignCreationSuccess.value = false
  } finally {
    isCreatingCampaign.value = false
  }
}

const resetCampaignForm = () => {
  campaignForm.value = {
    campaign_name: '',
    objective_type: '',
    budget_mode: '',
    budget: 50,
    app_promotion_type: '',
    description: ''
  }
  
  campaignFormErrors.value = {}
  campaignCreationMessage.value = ''
  campaignCreationSuccess.value = false
}

// Watch for selected advertiser changes
watch(() => store.selectedAdvertiserId, async (newAdvertiserId) => {
  if (newAdvertiserId) {
    console.log('Loading campaigns for account:', newAdvertiserId)
    await refreshCampaignData()
  }
})

// Lifecycle
onMounted(async () => {
  console.log('TikTok Campaign Manager mounted')
  if (store.selectedAdvertiserId) {
    await refreshCampaignData()
  }
})
</script>

<style scoped>
.accordion-button:not(.collapsed) {
  background-color: var(--bs-light);
  border-color: var(--bs-border-color);
}

.accordion-button:focus {
  box-shadow: none;
  border-color: var(--bs-border-color);
}

.card .card-body.p-3 {
  min-height: 80px;
}

.list-group-item:hover {
  background-color: var(--bs-gray-50);
}

.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
}

@media (max-width: 767.98px) {
  .btn-group {
    flex-direction: column;
  }

  .btn-group .btn {
    border-radius: 0.375rem !important;
    margin-bottom: 0.25rem;
  }
}

/* Loading animation */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Новые стили для статистики */
.stats-overlay {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: normal;
  opacity: 0.8;
}

.stat-card-body.position-relative {
  min-height: 85px;
}

/* Custom purple color */
.text-purple {
  color: #6f42c1 !important;
}

/* Stat cards responsive */
.stat-card-body {
  padding: 0.75rem 0.5rem;
}

.stat-title {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.stat-number {
  font-size: 1.25rem;
  margin-bottom: 0;
  font-weight: 700;
}

/* Campaigns header */
.campaigns-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.campaigns-title-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Campaign items */
.campaign-item-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.campaign-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.campaign-btn {
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Кнопка удаления */
.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-outline-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.campaign-name {
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.campaign-details {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Mobile styles for 576px and below */
@media (max-width: 575.98px) {
  .stat-card-body {
    padding: 0.5rem;
  }
  
  .stat-title {
    font-size: 0.7rem;
  }
  
  .stat-number {
    font-size: 1rem;
  }
  
  .campaigns-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .campaign-item-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .campaign-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  .campaign-btn {
    min-width: 32px;
  }
  
  .campaign-btn {
    min-width: 36px;
    padding: 0.25rem 0.5rem;
  }
  
  .create-campaign-btn {
    font-size: 0.8rem;
    padding: 0.375rem 0.75rem;
  }
}

/* Extra small screens (350px and below) */
@media (max-width: 350px) {
  .stat-card-body {
    padding: 0.375rem 0.25rem;
  }
  
  .stat-title {
    font-size: 0.65rem;
  }
  
  .stat-number {
    font-size: 0.9rem;
  }
  
  .campaigns-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .campaigns-title-section {
    justify-content: space-between;
    width: 100%;
  }
  
  .create-campaign-btn {
    width: 100%;
    font-size: 0.8rem;
  }
  
  .refresh-btn {
    padding: 0.25rem 0.5rem;
  }
  
  .campaign-name {
    font-size: 0.9rem;
    line-height: 1.2;
  }
  
  .campaign-details {
    font-size: 0.75rem;
    line-height: 1.3;
  }
  
  .campaign-separator {
    display: none;
  }
  
  .campaign-budget,
  .campaign-status {
    display: block;
    margin: 0.1rem 0;
  }
  
  .campaign-btn {
    min-width: 28px;
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
  }
  
  .campaign-actions {
    justify-content: space-between;
  }
}

/* Campaign creation form styles */
.campaign-creation-form {
  max-width: 100%;
}

.campaign-creation-form .form-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.campaign-creation-form .form-control,
.campaign-creation-form .form-select {
  border-radius: 0.375rem;
}

.campaign-creation-form .input-group-text {
  background-color: var(--bs-light);
  border-color: var(--bs-border-color);
}

/* Mobile responsive form styles */
@media (max-width: 575.98px) {
  .campaign-creation-form .col-md-6 {
    margin-bottom: 1rem;
  }
  
  .campaign-creation-form .form-label {
    font-size: 0.875rem;
  }
  
  .campaign-creation-form .form-control,
  .campaign-creation-form .form-select {
    font-size: 0.875rem;
  }
  
  .campaign-creation-form .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  
  .campaign-creation-form .d-flex {
    flex-direction: column;
  }
}

@media (max-width: 350px) {
  .campaign-creation-form .form-label {
    font-size: 0.8rem;
  }
  
  .campaign-creation-form .form-control,
  .campaign-creation-form .form-select {
    font-size: 0.8rem;
    padding: 0.375rem 0.5rem;
  }
  
  .campaign-creation-form .form-text {
    font-size: 0.7rem;
  }
}
</style>
