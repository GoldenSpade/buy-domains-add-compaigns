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
                      <div class="btn-group" role="group">
                        <button class="btn btn-primary btn-sm" @click="openCreateCampaign">
                          <i class="bi bi-plus me-1 d-none d-sm-inline"></i>
                          <span class="d-none d-sm-inline">Create Campaign</span>
                          <span class="d-inline d-sm-none">Quick</span>
                        </button>
                      </div>
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
                        class="list-group-item py-3"
                      >
                        <div class="campaign-item-wrapper">
                          <div class="campaign-info">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                              <h6 class="campaign-name mb-0">{{ campaign.campaign_name }}</h6>
                              <small class="text-muted ms-3">ID: {{ campaign.campaign_id }}</small>
                            </div>
                            
                            <div class="campaign-details mb-3">
                              <div class="row g-3">
                                <div class="col-md-6">
                                  <small class="text-muted d-block mb-1">Budget & Type</small>
                                  <span class="fw-medium">
                                    ${{ campaign.budget || 'N/A' }} 
                                    <small class="text-muted">({{ formatCampaignBudgetMode(campaign.budget_mode) }})</small>
                                  </span>
                                  <br>
                                  <small class="text-muted">Objective: {{ formatCampaignObjective(campaign.objective_type) }}</small>
                                </div>
                                <div class="col-md-6">
                                  <small class="text-muted d-block mb-1">Status & Performance</small>
                                  <span class="fw-medium">
                                    <span :class="getCampaignStatusClass(campaign.operation_status)">
                                      {{ formatCampaignStatus(campaign.operation_status) }}
                                    </span>
                                  </span>
                                  <br>
                                  <small class="text-muted">Type: {{ formatCampaignType(campaign.campaign_type) }}</small>
                                </div>
                              </div>
                            </div>
                            
                            <div class="campaign-meta">
                              <small class="text-muted">
                                <i class="bi bi-calendar3 me-1"></i>
                                Created: {{ formatCampaignDate(campaign.create_time) }}
                              </small>
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
                              title="Manage Ad Groups"
                              @click="openAdGroupManager(campaign.campaign_id, campaign.campaign_name)"
                              :disabled="store.loading"
                            >
                              <i class="bi bi-collection"></i>
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
                      <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-primary" @click="openCreateCampaign">
                          <i class="bi bi-plus me-1"></i>Create Campaign
                        </button>
                      </div>
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
                  <div class="accordion-body p-0">
                    <!-- Campaign Creation Wizard -->
                    <div class="campaign-creation-wizard">
                      <!-- Progress Bar -->
                      <div class="wizard-progress bg-light p-3 border-bottom">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <h6 class="mb-0">
                            <i class="bi bi-plus-circle me-2"></i>Create New Campaign
                          </h6>
                          <span class="badge bg-primary">Step {{ currentFormStep }} of {{ totalFormSteps }}</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                          <div 
                            class="progress-bar progress-bar-striped" 
                            :style="{ width: (currentFormStep / totalFormSteps * 100) + '%' }"
                          ></div>
                        </div>
                        <div class="d-flex justify-content-between mt-2">
                          <small class="text-muted">Basic Info</small>
                          <small class="text-muted">Objective</small>
                          <small class="text-muted">Budget</small>
                          <small class="text-muted">Review</small>
                        </div>
                      </div>

                      <!-- Form Content -->
                      <div class="wizard-content p-4">
                        <form @submit.prevent="handleCreateCampaign">
                          <!-- Step 1: Basic Information -->
                          <div v-if="currentFormStep === 1" class="wizard-step">
                            <h5 class="mb-4 text-primary">
                              <i class="bi bi-info-circle me-2"></i>Basic Information
                            </h5>
                            
                            <div class="row g-4">
                              <!-- Campaign Name -->
                              <div class="col-12">
                                <label for="campaignName" class="form-label fw-bold">
                                  Campaign Name <span class="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  class="form-control form-control-lg"
                                  id="campaignName"
                                  v-model="campaignForm.campaign_name"
                                  placeholder="Enter a descriptive campaign name (e.g., 'Summer Sale 2024')"
                                  :class="{ 'is-invalid': campaignFormErrors.campaign_name }"
                                  maxlength="512"
                                >
                                <div v-if="campaignFormErrors.campaign_name" class="invalid-feedback">
                                  {{ campaignFormErrors.campaign_name }}
                                </div>
                                <div class="form-text">
                                  {{ campaignForm.campaign_name.length }}/512 characters
                                </div>
                              </div>

                              <!-- Campaign Description -->
                              <div class="col-12">
                                <label for="campaignDescription" class="form-label fw-bold">
                                  Campaign Description <span class="text-muted">(Optional)</span>
                                </label>
                                <textarea
                                  class="form-control"
                                  id="campaignDescription"
                                  v-model="campaignForm.description"
                                  rows="4"
                                  placeholder="Describe your campaign goals, target audience, and key messages..."
                                  maxlength="1000"
                                ></textarea>
                                <div class="form-text">
                                  {{ campaignForm.description.length }}/1000 characters
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Step 2: Campaign Objective -->
                          <div v-if="currentFormStep === 2" class="wizard-step">
                            <h5 class="mb-4 text-primary">
                              <i class="bi bi-target me-2"></i>Campaign Objective
                            </h5>
                            
                            <div class="row g-3">
                              <div class="col-12">
                                <label class="form-label fw-bold mb-3">
                                  What's your advertising objective? <span class="text-danger">*</span>
                                </label>
                                <div class="objective-options">
                                  <div 
                                    v-for="objective in campaignObjectives" 
                                    :key="objective.value"
                                    class="objective-card"
                                    :class="{ 'selected': campaignForm.objective_type === objective.value }"
                                    @click="campaignForm.objective_type = objective.value"
                                  >
                                    <div class="objective-header">
                                      <input 
                                        type="radio" 
                                        :value="objective.value" 
                                        v-model="campaignForm.objective_type"
                                        :id="'obj-' + objective.value"
                                        class="form-check-input me-2"
                                      >
                                      <strong>{{ objective.label }}</strong>
                                    </div>
                                    <p class="objective-desc mb-0 mt-2">{{ objective.desc }}</p>
                                  </div>
                                </div>
                                <div v-if="campaignFormErrors.objective_type" class="text-danger mt-2">
                                  {{ campaignFormErrors.objective_type }}
                                </div>
                              </div>

                              <!-- App Promotion Type (conditional) -->
                              <div v-if="campaignForm.objective_type === 'APP_PROMOTION'" class="col-12">
                                <label class="form-label fw-bold mb-3">
                                  App Promotion Type <span class="text-danger">*</span>
                                </label>
                                <div class="row g-2">
                                  <div 
                                    v-for="appType in appPromotionTypes" 
                                    :key="appType.value"
                                    class="col-md-6"
                                  >
                                    <div 
                                      class="app-promotion-card"
                                      :class="{ 'selected': campaignForm.app_promotion_type === appType.value }"
                                      @click="campaignForm.app_promotion_type = appType.value"
                                    >
                                      <input 
                                        type="radio" 
                                        :value="appType.value" 
                                        v-model="campaignForm.app_promotion_type"
                                        :id="'app-' + appType.value"
                                        class="form-check-input me-2"
                                      >
                                      <div>
                                        <strong>{{ appType.label }}</strong>
                                        <p class="mb-0 mt-1 small text-muted">{{ appType.desc }}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <!-- Optimization Goal -->
                              <div v-if="campaignForm.objective_type && optimizationGoals[campaignForm.objective_type]" class="col-12">
                                <label for="optimizationGoal" class="form-label fw-bold">
                                  Optimization Goal <span class="text-muted">(Optional)</span>
                                </label>
                                <select
                                  class="form-select"
                                  id="optimizationGoal"
                                  v-model="campaignForm.optimization_goal"
                                >
                                  <option value="">Auto (Recommended)</option>
                                  <option 
                                    v-for="goal in optimizationGoals[campaignForm.objective_type]" 
                                    :key="goal" 
                                    :value="goal"
                                  >
                                    {{ goal.replace('_', ' ') }}
                                  </option>
                                </select>
                                <div class="form-text">
                                  TikTok will automatically optimize for the best results based on your objective
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Step 3: Budget & Schedule -->
                          <div v-if="currentFormStep === 3" class="wizard-step">
                            <h5 class="mb-4 text-primary">
                              <i class="bi bi-wallet2 me-2"></i>Budget & Schedule
                            </h5>
                            
                            <div class="row g-4">
                              <!-- Budget Settings -->
                              <div class="col-12">
                                <div class="budget-section p-4 border rounded">
                                  <h6 class="mb-3">
                                    <i class="bi bi-currency-dollar me-2"></i>Budget Settings
                                  </h6>
                                  
                                  <div class="row g-3">
                                    <!-- Budget Mode -->
                                    <div class="col-12">
                                      <label class="form-label fw-bold">
                                        Budget Type <span class="text-danger">*</span>
                                      </label>
                                      <div class="row g-2">
                                        <div 
                                          v-for="budgetMode in budgetModes" 
                                          :key="budgetMode.value"
                                          class="col-md-6"
                                        >
                                          <div 
                                            class="budget-card"
                                            :class="{ 'selected': campaignForm.budget_mode === budgetMode.value }"
                                            @click="campaignForm.budget_mode = budgetMode.value"
                                          >
                                            <input 
                                              type="radio" 
                                              :value="budgetMode.value" 
                                              v-model="campaignForm.budget_mode"
                                              :id="'budget-' + budgetMode.value"
                                              class="form-check-input me-2"
                                            >
                                            <div>
                                              <strong>{{ budgetMode.label }}</strong>
                                              <p class="mb-0 mt-1 small text-muted">{{ budgetMode.desc }}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <!-- Budget Amount -->
                                    <div class="col-md-8">
                                      <label for="budget" class="form-label fw-bold">
                                        {{ campaignForm.budget_mode === 'BUDGET_MODE_DAY' ? 'Daily' : 'Total' }} Budget Amount <span class="text-danger">*</span>
                                      </label>
                                      <div class="input-group input-group-lg">
                                        <span class="input-group-text">$</span>
                                        <input
                                          type="number"
                                          class="form-control"
                                          id="budget"
                                          v-model.number="campaignForm.budget"
                                          :placeholder="campaignForm.budget_mode === 'BUDGET_MODE_DAY' ? '50.00' : '1500.00'"
                                          min="50"
                                          step="0.01"
                                          :class="{ 'is-invalid': campaignFormErrors.budget }"
                                        >
                                      </div>
                                      <div v-if="campaignFormErrors.budget" class="invalid-feedback">
                                        {{ campaignFormErrors.budget }}
                                      </div>
                                      <div class="form-text">
                                        Minimum: $50 {{ campaignForm.budget_mode === 'BUDGET_MODE_DAY' ? 'per day' : 'total' }}
                                        <span v-if="campaignForm.budget_mode === 'BUDGET_MODE_TOTAL' && campaignForm.budget > 0">
                                          (Approx. ${{ (campaignForm.budget / 30).toFixed(2) }} per day)
                                        </span>
                                      </div>
                                    </div>

                                    <!-- Bid Strategy -->
                                    <div class="col-12">
                                      <label for="bidType" class="form-label fw-bold">
                                        Bidding Strategy
                                      </label>
                                      <select
                                        class="form-select"
                                        id="bidType"
                                        v-model="campaignForm.bid_type"
                                      >
                                        <option 
                                          v-for="bidType in bidTypes" 
                                          :key="bidType.value" 
                                          :value="bidType.value"
                                        >
                                          {{ bidType.label }}
                                        </option>
                                      </select>
                                      <div class="form-text">
                                        We'll automatically bid to get you the most results for your budget
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <!-- Schedule Settings -->
                              <div class="col-12">
                                <div class="schedule-section p-4 border rounded">
                                  <h6 class="mb-3">
                                    <i class="bi bi-calendar3 me-2"></i>Schedule
                                  </h6>
                                  
                                  <div class="row g-3">
                                    <div class="col-md-6">
                                      <label for="scheduleStart" class="form-label fw-bold">
                                        Start Date
                                      </label>
                                      <input
                                        type="datetime-local"
                                        class="form-control"
                                        id="scheduleStart"
                                        v-model="campaignForm.schedule_start_time"
                                      >
                                    </div>
                                    <div class="col-md-6">
                                      <label for="scheduleEnd" class="form-label fw-bold">
                                        End Date <span class="text-muted">(Optional)</span>
                                      </label>
                                      <input
                                        type="datetime-local"
                                        class="form-control"
                                        id="scheduleEnd"
                                        v-model="campaignForm.schedule_end_time"
                                      >
                                    </div>
                                  </div>
                                  <div class="form-text mt-2">
                                    Leave end date empty to run campaign continuously until manually paused
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Step 4: Review & Create -->
                          <div v-if="currentFormStep === 4" class="wizard-step">
                            <h5 class="mb-4 text-primary">
                              <i class="bi bi-check-square me-2"></i>Review & Create
                            </h5>
                            
                            <div class="campaign-review">
                              <!-- Campaign Summary -->
                              <div class="review-section mb-4 p-4 border rounded bg-light">
                                <h6 class="mb-3">Campaign Summary</h6>
                                <div class="row g-2">
                                  <div class="col-md-6">
                                    <strong>Campaign Name:</strong><br>
                                    <span class="text-muted">{{ campaignForm.campaign_name || 'Not specified' }}</span>
                                  </div>
                                  <div class="col-md-6">
                                    <strong>Objective:</strong><br>
                                    <span class="text-muted">{{ 
                                      campaignObjectives.find(obj => obj.value === campaignForm.objective_type)?.label || 'Not selected'
                                    }}</span>
                                  </div>
                                  <div class="col-md-6">
                                    <strong>Budget:</strong><br>
                                    <span class="text-muted">
                                      ${{ campaignForm.budget }} {{ campaignForm.budget_mode === 'BUDGET_MODE_DAY' ? 'per day' : 'total' }}
                                    </span>
                                  </div>
                                  <div class="col-md-6">
                                    <strong>Bid Strategy:</strong><br>
                                    <span class="text-muted">{{ campaignForm.bid_type.replace('_', ' ') }}</span>
                                  </div>
                                </div>
                              </div>

                              <!-- Important Notes -->
                              <div class="alert alert-info">
                                <h6 class="alert-heading">
                                  <i class="bi bi-info-circle me-2"></i>Before you create this campaign
                                </h6>
                                <ul class="mb-0">
                                  <li>Make sure you have ad creatives ready for your ad groups</li>
                                  <li>Review TikTok's advertising policies to ensure compliance</li>
                                  <li>Your campaign will be created in a paused state for review</li>
                                  <li>You can modify most settings after creation</li>
                                </ul>
                              </div>
                            </div>
                          </div>

                          <!-- Navigation & Actions -->
                          <div class="wizard-navigation d-flex justify-content-between align-items-center pt-4 border-top">
                            <div>
                              <button
                                v-if="currentFormStep > 1"
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="currentFormStep--"
                                :disabled="isCreatingCampaign"
                              >
                                <i class="bi bi-arrow-left me-2"></i>Previous
                              </button>
                            </div>
                            
                            <div class="d-flex gap-2">
                              <button
                                type="button"
                                class="btn btn-outline-secondary"
                                @click="resetCampaignForm"
                                :disabled="isCreatingCampaign"
                              >
                                <i class="bi bi-arrow-clockwise me-2"></i>Reset
                              </button>
                              
                              <button
                                v-if="currentFormStep < totalFormSteps"
                                type="button"
                                class="btn btn-primary"
                                @click="nextStep"
                                :disabled="!isStepValid"
                              >
                                Next<i class="bi bi-arrow-right ms-2"></i>
                              </button>
                              
                              <button
                                v-if="currentFormStep === totalFormSteps"
                                type="submit"
                                class="btn btn-success btn-lg"
                                :disabled="isCreatingCampaign || !isFormValid"
                              >
                                <div v-if="isCreatingCampaign" class="spinner-border spinner-border-sm me-2" role="status"></div>
                                <i v-else class="bi bi-plus-circle me-2"></i>
                                {{ isCreatingCampaign ? 'Creating Campaign...' : 'Create Campaign' }}
                              </button>
                            </div>
                          </div>

                          <!-- Success/Error Messages убраны - используем тосты -->
                        </form>
                      </div>
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

    <!-- TikTok Ad Group Manager Component -->
    <TikTokAdGroupManager 
      v-if="showAdGroupManager"
      :campaign-id="selectedCampaignForAdGroups.id"
      :campaign-name="selectedCampaignForAdGroups.name"
      @back-to-campaigns="closeAdGroupManager"
    />

  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useTikTokStore } from '@/stores/tiktokStore'
import TikTokAdGroupManager from './TikTokAdGroupManager.vue'

const store = useTikTokStore()

// Use store data directly
const campaigns = computed(() => store.campaigns)
const campaignStats = computed(() => store.campaignStats)

// Campaign creation form data - расширенная версия
const campaignForm = ref({
  campaign_name: '',
  objective_type: '',
  budget_mode: '',
  budget: 50,
  app_promotion_type: '',
  description: '',
  // Дополнительные параметры
  rf_campaign_type: 'STANDARD',
  campaign_type: 'REGULAR_CAMPAIGN',
  schedule_type: 'SCHEDULE_START_END',
  schedule_start_time: '',
  schedule_end_time: '',
  dayparting: 'ALL_TIME',
  bid_type: 'BID_TYPE_NO_BID',
  deep_bid_type: '',
  optimization_goal: '',
  conversion_id: '',
  deep_cpa_bid: 0,
  // Targeting
  languages: [],
  locations: [],
  age_groups: [],
  genders: [],
  interests: [],
  behaviors: [],
  // Креативные настройки
  brand_safety_type: 'STANDARD_INVENTORY',
  brand_safety_partner: '',
  inventory_filter_enabled: false,
  comment_disabled: false
})

const campaignFormErrors = ref({})
const isCreatingCampaign = ref(false)
// Campaign creation messages убраны - используем тосты

// Дополнительные состояния для расширенной формы
const showAdvancedSettings = ref(false)
const currentFormStep = ref(1) // Многоступенчатая форма
const totalFormSteps = ref(4)

// Ad Group Manager state
const showAdGroupManager = ref(false)
const selectedCampaignForAdGroups = ref({
  id: '',
  name: ''
})


// Computed опции для селектов на основе API данных
const campaignObjectives = computed(() => {
  if (store.campaignMetadata.objectives.length > 0) {
    return store.campaignMetadata.objectives.map(obj => ({
      value: obj.value,
      label: obj.name,
      desc: getObjectiveDescription(obj.value)
    }))
  }
  
  // Fallback если API не загрузился
  return [
    { value: 'REACH', label: 'Reach - Brand Awareness', desc: 'Show your ads to the maximum number of people' },
    { value: 'TRAFFIC', label: 'Traffic - Website visits', desc: 'Drive traffic to your website or app' },
    { value: 'APP_PROMOTION', label: 'App Promotion', desc: 'Promote your mobile app' },
    { value: 'WEB_CONVERSIONS', label: 'Conversions', desc: 'Drive valuable actions on your website' },
    { value: 'LEAD_GENERATION', label: 'Lead Generation', desc: 'Collect leads for your business' },
    { value: 'ENGAGEMENT', label: 'Engagement', desc: 'Get more likes, comments, shares, and follows' },
    { value: 'VIDEO_VIEW', label: 'Video Views', desc: 'Get more views for your videos' },
    { value: 'CATALOG_SALES', label: 'Catalog Sales', desc: 'Show products from your catalog' }
  ]
})

// Computed опции для типов ставок на основе API данных
const bidTypes = computed(() => {
  if (store.campaignMetadata.bidTypes.length > 0) {
    return store.campaignMetadata.bidTypes.map(bid => ({
      value: bid.value,
      label: bid.name,
      desc: getBidTypeDescription(bid.value)
    }))
  }
  
  // Fallback если API не загрузился
  return [
    { value: 'BID_TYPE_NO_BID', label: 'Automatic Bidding', desc: 'Let TikTok optimize your bidding automatically' },
    { value: 'BID_TYPE_MAX_CONVERSION', label: 'Maximum Conversions', desc: 'Maximize conversions within your budget' },
    { value: 'BID_TYPE_CUSTOM', label: 'Custom Bid', desc: 'Set your own bid amount' }
  ]
})

const budgetModes = [
  { value: 'BUDGET_MODE_DAY', label: 'Daily Budget', desc: 'Set a budget for each day' },
  { value: 'BUDGET_MODE_TOTAL', label: 'Lifetime Budget', desc: 'Set a total budget for the entire campaign duration' }
]

const appPromotionTypes = [
  { value: 'APP_INSTALL', label: 'App Installs', desc: 'Drive new app installations' },
  { value: 'APP_RETARGETING', label: 'App Retargeting', desc: 'Re-engage existing app users' }
]

const optimizationGoals = {
  'REACH': ['REACH'],
  'TRAFFIC': ['CLICK', 'LANDING_PAGE_VIEW'],
  'APP_PROMOTION': ['INSTALL', 'APP_EVENT'],
  'WEB_CONVERSIONS': ['CONVERSION', 'VALUE'],
  'LEAD_GENERATION': ['LEAD'],
  'ENGAGEMENT': ['LIKE', 'COMMENT', 'SHARE', 'PROFILE_VISIT'],
  'VIDEO_VIEW': ['VIEW_CONTENT', 'COMPLETE_VIEW'],
  'CATALOG_SALES': ['PRODUCT_DETAILS_PAGE_VIEW', 'ADD_TO_CART', 'PURCHASE']
}

const ageGroups = [
  { value: 'AGE_13_17', label: '13-17' },
  { value: 'AGE_18_24', label: '18-24' },
  { value: 'AGE_25_34', label: '25-34' },
  { value: 'AGE_35_44', label: '35-44' },
  { value: 'AGE_45_54', label: '45-54' },
  { value: 'AGE_55_PLUS', label: '55+' }
]

const genderOptions = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'UNLIMITED', label: 'All genders' }
]

// Computed properties
const shouldShowCampaignManager = computed(() => {
  return store.isAuthenticated && store.selectedAdvertiserId
})

const recentCampaigns = computed(() => {
  // Sort by create_time (newest first) and take first 5
  return campaigns.value
    .slice() // Create copy to avoid mutating original array
    .sort((a, b) => {
      // Parse dates and sort in descending order (newest first)
      const dateA = new Date(typeof a.create_time === 'number' ? a.create_time * 1000 : a.create_time || 0)
      const dateB = new Date(typeof b.create_time === 'number' ? b.create_time * 1000 : b.create_time || 0)
      return dateB - dateA
    })
    .slice(0, 5)
})

// Form validation
const isFormValid = computed(() => {
  const form = campaignForm.value
  const hasRequiredFields = form.campaign_name && 
                           form.objective_type && 
                           form.budget_mode && 
                           form.budget >= 50
  
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

// Helper функции для описаний
const getObjectiveDescription = (objective) => {
  const descriptions = {
    'REACH': 'Show your ads to the maximum number of people',
    'TRAFFIC': 'Drive traffic to your website or app',
    'APP_PROMOTION': 'Promote your mobile app',
    'WEB_CONVERSIONS': 'Drive valuable actions on your website',
    'LEAD_GENERATION': 'Collect leads for your business',
    'ENGAGEMENT': 'Get more likes, comments, shares, and follows',
    'VIDEO_VIEW': 'Get more views for your videos',
    'CATALOG_SALES': 'Show products from your catalog'
  }
  return descriptions[objective] || 'Campaign objective'
}

const getBidTypeDescription = (bidType) => {
  const descriptions = {
    'BID_TYPE_NO_BID': 'Let TikTok optimize your bidding automatically',
    'BID_TYPE_MAX_CONVERSION': 'Maximize conversions within your budget',
    'BID_TYPE_CUSTOM': 'Set your own bid amount'
  }
  return descriptions[bidType] || 'Bidding strategy'
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

const formatCampaignStatus = (status) => {
  const statusNames = {
    ENABLE: 'Active',
    DISABLE: 'Disabled',
    PAUSED: 'Paused',
    PENDING: 'Pending',
  }
  return statusNames[status] || status
}

const formatCampaignBudgetMode = (mode) => {
  const modeNames = {
    BUDGET_MODE_DAY: 'Daily',
    BUDGET_MODE_TOTAL: 'Total',
    CAMPAIGN_BUDGET_MODE_DAILY: 'Daily',
    CAMPAIGN_BUDGET_MODE_TOTAL: 'Total',
  }
  return modeNames[mode] || mode || 'Daily'
}

const formatCampaignObjective = (objective) => {
  const objectiveNames = {
    REACH: 'Reach',
    TRAFFIC: 'Traffic',
    APP_PROMOTION: 'App Promotion',
    WEB_CONVERSIONS: 'Conversions',
    LEAD_GENERATION: 'Lead Generation',
    ENGAGEMENT: 'Engagement',
    VIDEO_VIEW: 'Video Views',
    CATALOG_SALES: 'Catalog Sales',
  }
  return objectiveNames[objective] || objective || 'Traffic'
}

const formatCampaignType = (type) => {
  const typeNames = {
    AUCTION: 'Auction',
    REACH_FREQUENCY: 'Reach & Frequency',
    MANUAL_CAMPAIGN: 'Manual',
    AUTOMATED_CAMPAIGN: 'Automated',
  }
  return typeNames[type] || type || 'Standard'
}

const formatCampaignDate = (dateString) => {
  if (!dateString) return 'N/A'
  try {
    // Handle both timestamp and date string formats
    const date = new Date(typeof dateString === 'number' ? dateString * 1000 : dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}


const openCreateCampaign = () => {
  // Открыть аккордеон создания кампании
  const createAccordion = document.getElementById('creatorCollapse')
  if (createAccordion && !createAccordion.classList.contains('show')) {
    const createButton = document.querySelector('[data-bs-target="#creatorCollapse"]')
    createButton?.click()
  }
}



const refreshCampaignData = async () => {
  if (store.selectedAdvertiserId) {
    await store.loadCampaignData()
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
    }
  }
}

// Ad Group Manager methods
const openAdGroupManager = (campaignId, campaignName) => {
  selectedCampaignForAdGroups.value = {
    id: campaignId,
    name: campaignName
  }
  showAdGroupManager.value = true
}

const closeAdGroupManager = () => {
  showAdGroupManager.value = false
  selectedCampaignForAdGroups.value = {
    id: '',
    name: ''
  }
  // Refresh campaign data when returning from ad groups
  refreshCampaignData()
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
  if (!form.budget || form.budget < 50) {
    errors.budget = 'Budget must be at least $50'
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
  // Ensure we're on the last step
  if (currentFormStep.value !== totalFormSteps.value) {
    return
  }

  // Validate form
  if (!validateCampaignForm()) {
    return
  }

  isCreatingCampaign.value = true

  try {
    const form = campaignForm.value

    // Prepare comprehensive campaign data for API
    const campaignData = {
      // Basic required fields
      campaign_name: form.campaign_name.trim(),
      objective_type: form.objective_type,
      budget_mode: form.budget_mode,
      budget: parseFloat(form.budget)
    }

    // Add optional fields if they have values
    if (form.description?.trim()) {
      campaignData.description = form.description.trim()
    }

    // App promotion specific
    if (form.objective_type === 'APP_PROMOTION' && form.app_promotion_type) {
      campaignData.app_promotion_type = form.app_promotion_type
    }

    // Budget and bidding
    if (form.bid_type) {
      campaignData.bid_type = form.bid_type
    }

    if (form.optimization_goal) {
      campaignData.optimization_goal = form.optimization_goal
    }

    // Schedule
    if (form.schedule_start_time) {
      campaignData.schedule_start_time = form.schedule_start_time
    }

    if (form.schedule_end_time) {
      campaignData.schedule_end_time = form.schedule_end_time
    }

    // Campaign type settings - только если это не стандартные значения
    if (form.rf_campaign_type && form.rf_campaign_type !== 'STANDARD') {
      campaignData.rf_campaign_type = form.rf_campaign_type
    }

    // Убираем campaign_type так как он может вызывать ошибки
    // if (form.campaign_type) {
    //   campaignData.campaign_type = form.campaign_type
    // }

    // Убираем дополнительные настройки безопасности, они могут вызывать ошибки
    // if (form.brand_safety_type) {
    //   campaignData.brand_safety_type = form.brand_safety_type
    // }

    // campaignData.comment_disabled = form.comment_disabled || false
    // campaignData.inventory_filter_enabled = form.inventory_filter_enabled || false

    console.log('Creating comprehensive campaign with data:', campaignData)

    // Call store method to create campaign
    const success = await store.createCampaign(campaignData)

    if (success) {
      // Reset form after successful creation
      setTimeout(() => {
        resetCampaignForm()
        
        // Switch to overview section
        const createAccordion = document.getElementById('creatorCollapse')
        if (createAccordion && createAccordion.classList.contains('show')) {
          const createButton = document.querySelector('[data-bs-target="#creatorCollapse"]')
          createButton?.click()
        }

        const overviewAccordion = document.getElementById('overviewCollapse')
        if (overviewAccordion && !overviewAccordion.classList.contains('show')) {
          const overviewButton = document.querySelector('[data-bs-target="#overviewCollapse"]')
          overviewButton?.click()
        }
      }, 1000) // Уменьшили время с 3 сек до 1 сек
    }
  } catch (error) {
    console.error('Error creating campaign:', error)
    // Ошибки теперь обрабатываются в store через тосты
  } finally {
    isCreatingCampaign.value = false
  }
}

// Wizard navigation methods
const isStepValid = computed(() => {
  const step = currentFormStep.value
  const form = campaignForm.value
  
  switch (step) {
    case 1: // Basic Info
      return form.campaign_name.trim().length >= 3
    case 2: // Objective
      if (form.objective_type === 'APP_PROMOTION') {
        return form.objective_type && form.app_promotion_type
      }
      return form.objective_type
    case 3: // Budget
      return form.budget_mode && form.budget >= 50
    case 4: // Review
      return isFormValid.value
    default:
      return false
  }
})

const nextStep = () => {
  if (currentFormStep.value < totalFormSteps.value && isStepValid.value) {
    currentFormStep.value++
  }
}

const previousStep = () => {
  if (currentFormStep.value > 1) {
    currentFormStep.value--
  }
}

const resetCampaignForm = () => {
  campaignForm.value = {
    campaign_name: '',
    objective_type: '',
    budget_mode: '',
    budget: 50,
    app_promotion_type: '',
    description: '',
    // Reset all other fields
    rf_campaign_type: 'STANDARD',
    campaign_type: 'REGULAR_CAMPAIGN',
    schedule_type: 'SCHEDULE_START_END',
    schedule_start_time: '',
    schedule_end_time: '',
    dayparting: 'ALL_TIME',
    bid_type: 'BID_TYPE_NO_BID',
    deep_bid_type: '',
    optimization_goal: '',
    conversion_id: '',
    deep_cpa_bid: 0,
    languages: [],
    locations: [],
    age_groups: [],
    genders: [],
    interests: [],
    behaviors: [],
    brand_safety_type: 'STANDARD_INVENTORY',
    brand_safety_partner: '',
    inventory_filter_enabled: false,
    comment_disabled: false
  }
  
  campaignFormErrors.value = {}
  currentFormStep.value = 1
}


// Watch for advertiser account changes
watch(() => store.selectedAdvertiserId, async (newAdvertiserId, oldAdvertiserId) => {
  if (newAdvertiserId && newAdvertiserId !== oldAdvertiserId) {
    console.log('Advertiser changed from', oldAdvertiserId, 'to', newAdvertiserId, '- refreshing campaign data')
    
    await Promise.all([
      refreshCampaignData(),
      store.getCampaignMetadata()
    ])
  }
})

onMounted(async () => {
  console.log('TikTok Campaign Manager mounted')
  if (store.selectedAdvertiserId) {
    await Promise.all([
      refreshCampaignData(),
      store.getCampaignMetadata()
    ])
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

/* Campaign creation wizard styles */
.campaign-creation-wizard {
  background-color: white;
}

.wizard-progress {
  background-color: #f8f9fa !important;
  border-bottom: 1px solid #dee2e6;
}

.wizard-content {
  min-height: 500px;
}

.wizard-step {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Objective selection cards */
.objective-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.objective-card {
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
}

.objective-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.objective-card.selected {
  border-color: #0d6efd;
  background-color: #f0f7ff;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
}

.objective-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #212529;
}

.objective-desc {
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.4;
}

/* App promotion cards */
.app-promotion-card {
  border: 2px solid #e9ecef;
  border-radius: 0.375rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.app-promotion-card:hover {
  border-color: #0d6efd;
}

.app-promotion-card.selected {
  border-color: #0d6efd;
  background-color: #f0f7ff;
}

/* Budget selection cards */
.budget-card {
  border: 2px solid #e9ecef;
  border-radius: 0.375rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.budget-card:hover {
  border-color: #198754;
}

.budget-card.selected {
  border-color: #198754;
  background-color: #f0fff4;
}

/* Budget and schedule sections */
.budget-section, .schedule-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef !important;
}

.budget-section h6, .schedule-section h6 {
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
}

/* Review section */
.campaign-review .review-section {
  background-color: #f8f9fa !important;
}

/* Wizard navigation */
.wizard-navigation {
  background-color: #f8f9fa;
  margin: 0 -1.5rem -1.5rem -1.5rem;
  padding: 1rem 1.5rem;
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

/* Progress bar styling */
.progress-bar {
  background-color: #0d6efd;
  transition: width 0.3s ease;
}

.progress {
  background-color: #e9ecef;
}

/* Form improvements */
.form-label.fw-bold {
  color: #212529;
  font-size: 0.875rem;
}

.form-control:focus, .form-select:focus {
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.input-group-lg .form-control {
  font-size: 1.1rem;
  font-weight: 500;
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

/* Mobile responsive wizard styles */
@media (max-width: 767.98px) {
  .objective-options {
    grid-template-columns: 1fr;
  }
  
  .wizard-content {
    padding: 1rem !important;
    min-height: 400px;
  }
  
  .wizard-navigation {
    margin: 0 -1rem -1rem -1rem;
    padding: 1rem;
  }
  
  .wizard-navigation .d-flex {
    flex-direction: column;
    gap: 1rem;
  }
  
  .wizard-navigation .btn {
    width: 100%;
  }
  
  .progress-bar {
    height: 8px;
  }
  
  .budget-section,
  .schedule-section {
    padding: 1rem !important;
  }
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
  
  .objective-card {
    padding: 0.75rem;
  }
  
  .objective-desc {
    font-size: 0.8rem;
  }
  
  .budget-card,
  .app-promotion-card {
    flex-direction: column;
    text-align: center;
    padding: 0.5rem;
  }
  
  .wizard-progress .d-flex {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
  
  .wizard-progress .badge {
    align-self: center;
  }
  
  .wizard-progress small {
    font-size: 0.7rem;
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
