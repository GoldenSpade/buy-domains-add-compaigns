<template>
  <div v-if="shouldShowAdGroupManager" class="mt-3">
    <!-- Ad Group Management Card -->
    <div class="card">
      <div class="card-header">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="bi bi-collection me-2"></i>Ad Groups Management
          </h5>
          <div class="d-flex align-items-center gap-2">
            <small class="text-muted d-none d-md-block">
              Campaign: {{ selectedCampaignName }}
            </small>
            <button 
              class="btn btn-outline-secondary btn-sm" 
              @click="$emit('back-to-campaigns')"
              title="Back to campaigns"
            >
              <i class="bi bi-arrow-left me-1"></i>
              <span class="d-none d-sm-inline">Back</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card-body p-0">
        <!-- Ad Group Overview Accordion -->
        <div class="accordion accordion-flush" id="adGroupAccordion">
          <!-- Overview Section -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="adGroupOverviewHeader">
              <button
                class="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#adGroupOverviewCollapse"
                aria-expanded="true"
                aria-controls="adGroupOverviewCollapse"
              >
                <i class="bi bi-bar-chart me-2"></i>
                Ad Groups Overview
              </button>
            </h2>
            <div
              id="adGroupOverviewCollapse"
              class="accordion-collapse collapse show"
              aria-labelledby="adGroupOverviewHeader"
              data-bs-parent="#adGroupAccordion"
            >
              <div class="accordion-body">
                <!-- Quick Stats -->
                <div class="row g-2 mb-4">
                  <div class="col-md-3 col-6">
                    <div class="card bg-light h-100">
                      <div class="card-body text-center stat-card-body">
                        <h6 class="stat-title">Active</h6>
                        <h4 class="stat-number">{{ store.adGroupStats.active || 0 }}</h4>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 col-6">
                    <div class="card bg-light h-100">
                      <div class="card-body text-center stat-card-body">
                        <h6 class="stat-title">Spend</h6>
                        <h4 class="stat-number">${{ store.adGroupStats.totalSpend || '0.00' }}</h4>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 col-6">
                    <div class="card bg-light h-100">
                      <div class="card-body text-center stat-card-body">
                        <h6 class="stat-title">Views</h6>
                        <h4 class="stat-number">
                          {{ formatNumber(store.adGroupStats.impressions) || '0' }}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 col-6">
                    <div class="card bg-light h-100">
                      <div class="card-body text-center stat-card-body">
                        <h6 class="stat-title">Clicks</h6>
                        <h4 class="stat-number">{{ formatNumber(store.adGroupStats.clicks) || '0' }}</h4>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Recent Ad Groups -->
                <div class="adgroups-header">
                  <div class="adgroups-title-section">
                    <h6 class="mb-0">Recent Ad Groups</h6>
                    <button 
                      class="btn btn-outline-primary btn-sm refresh-btn"
                      @click="refreshAdGroupData"
                      :disabled="store.adGroupLoading"
                      title="Refresh ad groups"
                    >
                      <i 
                        class="bi" 
                        :class="store.adGroupLoading ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'"
                      ></i>
                    </button>
                  </div>
                  <button class="btn btn-primary btn-sm create-adgroup-btn" @click="openCreateAdGroup">
                    <i class="bi bi-plus me-1 d-none d-sm-inline"></i>
                    <span class="d-none d-sm-inline">Create Ad Group</span>
                    <span class="d-inline d-sm-none">Create</span>
                  </button>
                </div>

                <!-- Loading indicator -->
                <div v-if="store.adGroupLoading" class="text-center py-3">
                  <div class="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                  <div class="small text-muted">Loading ad groups...</div>
                </div>

                <!-- Ad Groups List -->
                <div v-else-if="store.adGroups.length > 0" class="list-group">
                  <div
                    v-for="adGroup in recentAdGroups"
                    :key="adGroup.adgroup_id"
                    class="list-group-item"
                  >
                    <div class="adgroup-item-wrapper">
                      <div class="adgroup-info">
                        <h6 class="adgroup-name">{{ adGroup.adgroup_name }}</h6>
                        <div class="adgroup-details">
                          <span class="adgroup-budget">Budget: ${{ adGroup.budget || 'N/A' }}</span>
                          <span class="adgroup-separator">|</span>
                          <span class="adgroup-status">
                            Status: <span :class="getAdGroupStatusClass(adGroup.operation_status)">
                              {{ adGroup.operation_status }}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div class="adgroup-actions">
                        <button 
                          class="btn btn-outline-success btn-sm adgroup-btn" 
                          title="Start"
                          @click="startAdGroup(adGroup.adgroup_id)"
                          :disabled="adGroup.operation_status === 'ENABLE' || store.loading"
                        >
                          <i class="bi bi-play"></i>
                        </button>
                        <button 
                          class="btn btn-outline-secondary btn-sm adgroup-btn" 
                          title="Pause"
                          @click="pauseAdGroup(adGroup.adgroup_id)"
                          :disabled="adGroup.operation_status !== 'ENABLE' || store.loading"
                        >
                          <i class="bi bi-pause"></i>
                        </button>
                        <button 
                          class="btn btn-outline-primary btn-sm adgroup-btn" 
                          title="Edit"
                          :disabled="store.loading"
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button 
                          class="btn btn-outline-danger btn-sm adgroup-btn" 
                          title="Delete"
                          @click="deleteAdGroup(adGroup.adgroup_id, adGroup.adgroup_name)"
                          :disabled="store.loading"
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="!store.adGroupLoading" class="text-center py-4">
                  <i class="bi bi-collection-fill text-muted" style="font-size: 3rem"></i>
                  <h6 class="text-muted mt-3">No ad groups yet</h6>
                  <p class="text-muted small mb-3">
                    Create your first ad group for this campaign
                  </p>
                  <button class="btn btn-primary" @click="openCreateAdGroup">
                    <i class="bi bi-plus me-1"></i>Create Your First Ad Group
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Ad Group Creator Section -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="adGroupCreatorHeader">
              <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#adGroupCreatorCollapse"
                aria-expanded="false"
                aria-controls="adGroupCreatorCollapse"
              >
                <i class="bi bi-plus-circle me-2"></i>
                Create Ad Group
              </button>
            </h2>
            <div
              id="adGroupCreatorCollapse"
              class="accordion-collapse collapse"
              aria-labelledby="adGroupCreatorHeader"
              data-bs-parent="#adGroupAccordion"
            >
              <div class="accordion-body p-0">
                <!-- Ad Group Creation Wizard -->
                <div class="adgroup-creation-wizard">
                  <!-- Progress Bar -->
                  <div class="wizard-progress bg-light p-3 border-bottom">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="mb-0">
                        <i class="bi bi-plus-circle me-2"></i>Create New Ad Group
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
                      <small class="text-muted">Targeting</small>
                      <small class="text-muted">Budget</small>
                      <small class="text-muted">Review</small>
                    </div>
                  </div>

                  <!-- Form Content -->
                  <div class="wizard-content p-4">
                    <form @submit.prevent="handleCreateAdGroup">
                      <!-- Step 1: Basic Information -->
                      <div v-if="currentFormStep === 1" class="wizard-step">
                        <h5 class="mb-4 text-primary">
                          <i class="bi bi-info-circle me-2"></i>Basic Information
                        </h5>
                        
                        <div class="row g-4">
                          <!-- Ad Group Name -->
                          <div class="col-12">
                            <label for="adGroupName" class="form-label fw-bold">
                              Ad Group Name <span class="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              class="form-control form-control-lg"
                              id="adGroupName"
                              v-model="adGroupForm.adgroup_name"
                              placeholder="Enter a descriptive ad group name"
                              :class="{ 'is-invalid': adGroupFormErrors.adgroup_name }"
                              maxlength="512"
                            >
                            <div v-if="adGroupFormErrors.adgroup_name" class="invalid-feedback">
                              {{ adGroupFormErrors.adgroup_name }}
                            </div>
                            <div class="form-text">
                              {{ adGroupForm.adgroup_name.length }}/512 characters
                            </div>
                          </div>

                          <!-- Placements -->
                          <div class="col-12">
                            <label class="form-label fw-bold">
                              Ad Placements <span class="text-danger">*</span>
                            </label>
                            <div class="placement-options">
                              <div 
                                v-for="placement in availablePlacements" 
                                :key="placement.value"
                                class="placement-card"
                                :class="{ 'selected': adGroupForm.placements.includes(placement.value) }"
                                @click="togglePlacement(placement.value)"
                              >
                                <div class="placement-header">
                                  <input 
                                    type="checkbox" 
                                    :value="placement.value" 
                                    v-model="adGroupForm.placements"
                                    :id="'placement-' + placement.value"
                                    class="form-check-input me-2"
                                  >
                                  <strong>{{ placement.label }}</strong>
                                </div>
                                <p class="placement-desc mb-0 mt-2">{{ placement.desc }}</p>
                              </div>
                            </div>
                            <div v-if="adGroupFormErrors.placements" class="text-danger mt-2">
                              {{ adGroupFormErrors.placements }}
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Step 2: Targeting -->
                      <div v-if="currentFormStep === 2" class="wizard-step">
                        <h5 class="mb-4 text-primary">
                          <i class="bi bi-bullseye me-2"></i>Audience Targeting
                        </h5>
                        
                        <div class="row g-4">
                          <!-- Age Groups -->
                          <div class="col-12">
                            <label class="form-label fw-bold">
                              Age Groups
                            </label>
                            <div class="age-options">
                              <div 
                                v-for="age in ageGroups" 
                                :key="age.value"
                                class="age-card"
                                :class="{ 'selected': adGroupForm.age_groups.includes(age.value) }"
                                @click="toggleAgeGroup(age.value)"
                              >
                                <input 
                                  type="checkbox" 
                                  :value="age.value" 
                                  v-model="adGroupForm.age_groups"
                                  class="form-check-input me-2"
                                >
                                <span>{{ age.label }}</span>
                              </div>
                            </div>
                          </div>

                          <!-- Gender -->
                          <div class="col-12">
                            <label class="form-label fw-bold">
                              Gender
                            </label>
                            <div class="gender-options">
                              <div 
                                v-for="gender in genderOptions" 
                                :key="gender.value"
                                class="gender-card"
                                :class="{ 'selected': adGroupForm.genders.includes(gender.value) }"
                                @click="toggleGender(gender.value)"
                              >
                                <input 
                                  type="checkbox" 
                                  :value="gender.value" 
                                  v-model="adGroupForm.genders"
                                  class="form-check-input me-2"
                                >
                                <span>{{ gender.label }}</span>
                              </div>
                            </div>
                          </div>

                          <!-- Locations (simplified) -->
                          <div class="col-12">
                            <label class="form-label fw-bold">
                              Target Locations
                            </label>
                            <select
                              class="form-select"
                              v-model="selectedLocation"
                              @change="addLocation"
                            >
                              <option value="">Select a location...</option>
                              <option 
                                v-for="location in availableLocations" 
                                :key="location.location_id" 
                                :value="location.location_id"
                              >
                                {{ location.name }}
                              </option>
                            </select>
                            <div class="mt-2">
                              <span 
                                v-for="locationId in adGroupForm.locations" 
                                :key="locationId"
                                class="badge bg-primary me-1 mb-1"
                              >
                                {{ getLocationName(locationId) }}
                                <button 
                                  type="button" 
                                  class="btn-close btn-close-white ms-1" 
                                  @click="removeLocation(locationId)"
                                  style="font-size: 0.7em;"
                                ></button>
                              </span>
                            </div>
                          </div>

                          <!-- Interests -->
                          <div class="col-12">
                            <label class="form-label fw-bold">
                              Interests <span class="text-muted">(Optional)</span>
                            </label>
                            <select
                              class="form-select"
                              v-model="selectedInterest"
                              @change="addInterest"
                            >
                              <option value="">Select an interest...</option>
                              <option 
                                v-for="interest in availableInterests" 
                                :key="interest.interest_category_id" 
                                :value="interest.interest_category_id"
                              >
                                {{ interest.interest_category_name }}
                              </option>
                            </select>
                            <div class="mt-2">
                              <span 
                                v-for="interestId in adGroupForm.interests" 
                                :key="interestId"
                                class="badge bg-secondary me-1 mb-1"
                              >
                                {{ getInterestName(interestId) }}
                                <button 
                                  type="button" 
                                  class="btn-close btn-close-white ms-1" 
                                  @click="removeInterest(interestId)"
                                  style="font-size: 0.7em;"
                                ></button>
                              </span>
                            </div>
                            <div class="form-text">
                              Add interests to target users with specific preferences
                            </div>
                          </div>

                          <!-- Languages -->
                          <div class="col-12">
                            <label class="form-label fw-bold">
                              Languages <span class="text-muted">(Optional)</span>
                            </label>
                            <select
                              class="form-select"
                              v-model="selectedLanguage"
                              @change="addLanguage"
                            >
                              <option value="">Select a language...</option>
                              <option 
                                v-for="language in availableLanguages" 
                                :key="language.language_code" 
                                :value="language.language_code"
                              >
                                {{ language.language }}
                              </option>
                            </select>
                            <div class="mt-2">
                              <span 
                                v-for="languageCode in adGroupForm.languages" 
                                :key="languageCode"
                                class="badge bg-info me-1 mb-1"
                              >
                                {{ getLanguageName(languageCode) }}
                                <button 
                                  type="button" 
                                  class="btn-close btn-close-white ms-1" 
                                  @click="removeLanguage(languageCode)"
                                  style="font-size: 0.7em;"
                                ></button>
                              </span>
                            </div>
                            <div class="form-text">
                              Target users who speak specific languages
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Step 3: Budget & Bidding -->
                      <div v-if="currentFormStep === 3" class="wizard-step">
                        <h5 class="mb-4 text-primary">
                          <i class="bi bi-wallet2 me-2"></i>Budget & Bidding
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
                                        :class="{ 'selected': adGroupForm.budget_mode === budgetMode.value }"
                                        @click="adGroupForm.budget_mode = budgetMode.value"
                                      >
                                        <input 
                                          type="radio" 
                                          :value="budgetMode.value" 
                                          v-model="adGroupForm.budget_mode"
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
                                  <label for="adGroupBudget" class="form-label fw-bold">
                                    {{ adGroupForm.budget_mode === 'BUDGET_MODE_DAY' ? 'Daily' : 'Total' }} Budget Amount <span class="text-danger">*</span>
                                  </label>
                                  <div class="input-group input-group-lg">
                                    <span class="input-group-text">$</span>
                                    <input
                                      type="number"
                                      class="form-control"
                                      id="adGroupBudget"
                                      v-model.number="adGroupForm.budget"
                                      :placeholder="adGroupForm.budget_mode === 'BUDGET_MODE_DAY' ? '20.00' : '600.00'"
                                      min="20"
                                      step="0.01"
                                      :class="{ 'is-invalid': adGroupFormErrors.budget }"
                                    >
                                  </div>
                                  <div v-if="adGroupFormErrors.budget" class="invalid-feedback">
                                    {{ adGroupFormErrors.budget }}
                                  </div>
                                  <div class="form-text">
                                    Minimum: $20 {{ adGroupForm.budget_mode === 'BUDGET_MODE_DAY' ? 'per day' : 'total' }}
                                  </div>
                                </div>

                                <!-- Bid Type -->
                                <div class="col-12">
                                  <label for="adGroupBidType" class="form-label fw-bold">
                                    Bidding Strategy
                                  </label>
                                  <select
                                    class="form-select"
                                    id="adGroupBidType"
                                    v-model="adGroupForm.bid_type"
                                  >
                                    <option value="BID_TYPE_CUSTOM">Custom Bid</option>
                                    <option value="BID_TYPE_MAX_CONVERSION">Maximum Conversions</option>
                                    <option value="BID_TYPE_NO_BID">Automatic Bidding</option>
                                  </select>
                                  <div class="form-text">
                                    Custom Bid allows more control over your spending
                                  </div>
                                </div>

                                <!-- Bid Price (only for custom bidding) -->
                                <div class="col-md-4" v-show="adGroupForm.bid_type === 'BID_TYPE_CUSTOM'">
                                  <label for="adGroupBidPrice" class="form-label fw-bold">
                                    Bid Price <span class="text-danger">*</span>
                                  </label>
                                  <div class="input-group">
                                    <span class="input-group-text">$</span>
                                    <input
                                      type="number"
                                      class="form-control"
                                      id="adGroupBidPrice"
                                      v-model.number="adGroupForm.bid_price"
                                      placeholder="1.00"
                                      min="0.01"
                                      step="0.01"
                                    >
                                  </div>
                                  <div class="form-text">
                                    Amount you're willing to pay per click/impression
                                  </div>
                                </div>

                                <!-- Pacing Mode -->
                                <div class="col-12">
                                  <label for="adGroupPacing" class="form-label fw-bold">
                                    Delivery Pacing
                                  </label>
                                  <select
                                    class="form-select"
                                    id="adGroupPacing"
                                    v-model="adGroupForm.pacing"
                                  >
                                    <option value="PACING_MODE_SMOOTH">Smooth Delivery</option>
                                    <option value="PACING_MODE_FAST">Fast Delivery</option>
                                  </select>
                                  <div class="form-text">
                                    Smooth: Even budget distribution over time. Fast: Accelerated spending for faster results.
                                  </div>
                                </div>

                                <!-- Optimization Goal -->
                                <div class="col-md-6">
                                  <label for="adGroupOptimization" class="form-label fw-bold">
                                    Optimization Goal
                                  </label>
                                  <select
                                    class="form-select"
                                    id="adGroupOptimization"
                                    v-model="adGroupForm.optimization_goal"
                                  >
                                    <option 
                                      v-for="goal in availableOptimizationGoals" 
                                      :key="goal.value" 
                                      :value="goal.value"
                                    >
                                      {{ goal.name }}
                                    </option>
                                  </select>
                                  <div class="form-text">
                                    What you want to optimize for
                                  </div>
                                </div>

                                <!-- Billing Event -->
                                <div class="col-md-6">
                                  <label for="adGroupBilling" class="form-label fw-bold">
                                    Billing Event
                                  </label>
                                  <select
                                    class="form-select"
                                    id="adGroupBilling"
                                    v-model="adGroupForm.billing_event"
                                  >
                                    <option 
                                      v-for="event in availableBillingEvents" 
                                      :key="event.value" 
                                      :value="event.value"
                                    >
                                      {{ event.name }}
                                    </option>
                                  </select>
                                  <div class="form-text">
                                    How you want to be charged
                                  </div>
                                </div>

                                <!-- Promotion Type -->
                                <div class="col-12">
                                  <label for="adGroupPromotion" class="form-label fw-bold">
                                    Promotion Type
                                  </label>
                                  <select
                                    class="form-select"
                                    id="adGroupPromotion"
                                    v-model="adGroupForm.promotion_type"
                                  >
                                    <option 
                                      v-for="type in availablePromotionTypes" 
                                      :key="type.value" 
                                      :value="type.value"
                                    >
                                      {{ type.name }}
                                    </option>
                                  </select>
                                  <div class="form-text">
                                    Type of content you're promoting
                                  </div>
                                </div>
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
                        
                        <div class="adgroup-review">
                          <!-- Ad Group Summary -->
                          <div class="review-section mb-4 p-4 border rounded bg-light">
                            <h6 class="mb-3">Ad Group Summary</h6>
                            <div class="row g-2">
                              <div class="col-md-6">
                                <strong>Ad Group Name:</strong><br>
                                <span class="text-muted">{{ adGroupForm.adgroup_name || 'Not specified' }}</span>
                              </div>
                              <div class="col-md-6">
                                <strong>Placements:</strong><br>
                                <span class="text-muted">{{ adGroupForm.placements.length ? adGroupForm.placements.join(', ') : 'None selected' }}</span>
                              </div>
                              <div class="col-md-6">
                                <strong>Budget:</strong><br>
                                <span class="text-muted">
                                  ${{ adGroupForm.budget }} {{ adGroupForm.budget_mode === 'BUDGET_MODE_DAY' ? 'per day' : 'total' }}
                                </span>
                              </div>
                              <div class="col-md-6">
                                <strong>Targeting:</strong><br>
                                <span class="text-muted">
                                  Ages: {{ adGroupForm.age_groups.length || 'All' }}, 
                                  Locations: {{ adGroupForm.locations.length || 'All' }}
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- Important Notes -->
                          <div class="alert alert-info">
                            <h6 class="alert-heading">
                              <i class="bi bi-info-circle me-2"></i>Before you create this ad group
                            </h6>
                            <ul class="mb-0">
                              <li>Make sure you have ad creatives ready for your ads</li>
                              <li>Your ad group will be created in a paused state for review</li>
                              <li>You can modify most settings after creation</li>
                              <li>Consider your campaign's objective when setting targeting</li>
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
                            :disabled="isCreatingAdGroup"
                          >
                            <i class="bi bi-arrow-left me-2"></i>Previous
                          </button>
                        </div>
                        
                        <div class="d-flex gap-2">
                          <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="resetAdGroupForm"
                            :disabled="isCreatingAdGroup"
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
                            :disabled="isCreatingAdGroup || !isFormValid"
                          >
                            <div v-if="isCreatingAdGroup" class="spinner-border spinner-border-sm me-2" role="status"></div>
                            <i v-else class="bi bi-plus-circle me-2"></i>
                            {{ isCreatingAdGroup ? 'Creating Ad Group...' : 'Create Ad Group' }}
                          </button>
                        </div>
                      </div>

                      <!-- Success/Error Messages -->
                      <div v-if="adGroupCreationMessage" class="mt-3">
                        <div 
                          class="alert"
                          :class="adGroupCreationSuccess ? 'alert-success' : 'alert-danger'"
                        >
                          <i 
                            class="bi me-2"
                            :class="adGroupCreationSuccess ? 'bi-check-circle' : 'bi-exclamation-triangle'"
                          ></i>
                          {{ adGroupCreationMessage }}
                        </div>
                      </div>
                    </form>
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

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useTikTokStore } from '@/stores/tiktokStore'

const store = useTikTokStore()

// Props
const props = defineProps({
  campaignId: {
    type: String,
    required: true
  },
  campaignName: {
    type: String,
    required: true
  }
})

// Emits
const emit = defineEmits(['back-to-campaigns'])

// Computed properties
const shouldShowAdGroupManager = computed(() => {
  return store.isAuthenticated && store.selectedAdvertiserId && props.campaignId
})

const selectedCampaignName = computed(() => {
  return props.campaignName || 'Unknown Campaign'
})

const recentAdGroups = computed(() => {
  return store.adGroups.slice(0, 10) // Show 10 most recent
})

// Ad Group creation form data
const adGroupForm = ref({
  adgroup_name: '',
  campaign_id: props.campaignId,
  placements: ['PLACEMENT_TIKTOK'],
  budget_mode: '',
  budget: 20,
  bid_type: 'BID_TYPE_CUSTOM',
  bid_price: 1.0,
  pacing: 'PACING_MODE_SMOOTH',
  // Targeting
  age_groups: [],
  genders: [],
  locations: [],
  interests: [],
  languages: [],
  // Additional settings
  optimization_goal: 'CLICK',
  billing_event: 'CPC',
  promotion_type: 'WEBSITE',
  schedule_start_time: '',
  schedule_end_time: ''
})

const adGroupFormErrors = ref({})
const isCreatingAdGroup = ref(false)
const adGroupCreationMessage = ref('')
const adGroupCreationSuccess = ref(false)

// Form wizard state
const currentFormStep = ref(1)
const totalFormSteps = ref(4)
const selectedLocation = ref('')
const selectedInterest = ref('')
const selectedLanguage = ref('')

// Static options
const budgetModes = [
  { value: 'BUDGET_MODE_DAY', label: 'Daily Budget', desc: 'Set a budget for each day' },
  { value: 'BUDGET_MODE_TOTAL', label: 'Lifetime Budget', desc: 'Set a total budget for the entire ad group duration' }
]

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

// Computed options from store metadata
const availablePlacements = computed(() => {
  if (store.adGroupMetadata.placements?.length > 0) {
    return store.adGroupMetadata.placements.map(placement => ({
      value: placement.value,
      label: placement.name,
      desc: placement.value === 'PLACEMENT_TIKTOK' ? 'Show ads on TikTok app' : 'Show ads on Pangle network'
    }))
  }
  
  // Fallback placements
  return [
    { value: 'PLACEMENT_TIKTOK', label: 'TikTok', desc: 'Show ads on TikTok app' },
    { value: 'PLACEMENT_PANGLE', label: 'Pangle', desc: 'Show ads on Pangle network' }
  ]
})

const availableLocations = computed(() => {
  if (store.adGroupMetadata.locations.length > 0) {
    return store.adGroupMetadata.locations
  }
  
  // Fallback locations
  return [
    { location_id: '6252001', name: 'United States', location_type: 'COUNTRY' },
    { location_id: '6251999', name: 'Canada', location_type: 'COUNTRY' },
    { location_id: '2635167', name: 'United Kingdom', location_type: 'COUNTRY' },
    { location_id: '2921044', name: 'Germany', location_type: 'COUNTRY' },
    { location_id: '3017382', name: 'France', location_type: 'COUNTRY' }
  ]
})

const availableInterests = computed(() => {
  if (store.adGroupMetadata.interests?.length > 0) {
    return store.adGroupMetadata.interests
  }
  
  // Fallback interests
  return [
    { interest_category_id: '6311', interest_category_name: 'Technology' },
    { interest_category_id: '6312', interest_category_name: 'Sports' },
    { interest_category_id: '6313', interest_category_name: 'Fashion' },
    { interest_category_id: '6314', interest_category_name: 'Food & Dining' },
    { interest_category_id: '6315', interest_category_name: 'Travel' }
  ]
})

const availableLanguages = computed(() => {
  if (store.adGroupMetadata.languages?.length > 0) {
    return store.adGroupMetadata.languages
  }
  
  // Fallback languages
  return [
    { language_code: 'en', language: 'English' },
    { language_code: 'es', language: 'Spanish' },
    { language_code: 'fr', language: 'French' },
    { language_code: 'de', language: 'German' },
    { language_code: 'ja', language: 'Japanese' }
  ]
})

// Additional metadata computed properties
const availableOptimizationGoals = computed(() => {
  if (store.adGroupMetadata.optimization_goals?.length > 0) {
    return store.adGroupMetadata.optimization_goals
  }
  
  // Fallback optimization goals
  return [
    { value: 'CLICK', name: 'Clicks' },
    { value: 'REACH', name: 'Reach' },
    { value: 'IMPRESSION', name: 'Impressions' }
  ]
})

const availableBillingEvents = computed(() => {
  if (store.adGroupMetadata.billing_events?.length > 0) {
    return store.adGroupMetadata.billing_events
  }
  
  // Fallback billing events
  return [
    { value: 'CPC', name: 'Cost Per Click' },
    { value: 'CPM', name: 'Cost Per Mille' },
    { value: 'OCPC', name: 'Optimized CPC' }
  ]
})

const availablePromotionTypes = computed(() => {
  if (store.adGroupMetadata.promotion_types?.length > 0) {
    return store.adGroupMetadata.promotion_types
  }
  
  // Fallback promotion types
  return [
    { value: 'WEBSITE', name: 'Website' },
    { value: 'APP', name: 'App' },
    { value: 'ECOMMERCE', name: 'E-commerce' }
  ]
})

// Form validation
const isFormValid = computed(() => {
  const form = adGroupForm.value
  const hasRequiredFields = form.adgroup_name && 
                           form.placements.length > 0 && 
                           form.budget_mode && 
                           form.budget >= 20
  
  return hasRequiredFields
})

const isStepValid = computed(() => {
  const step = currentFormStep.value
  const form = adGroupForm.value
  
  switch (step) {
    case 1: // Basic Info
      return form.adgroup_name.trim().length >= 3 && form.placements.length > 0
    case 2: // Targeting
      return true // Targeting is optional
    case 3: // Budget
      return form.budget_mode && form.budget >= 20
    case 4: // Review
      return isFormValid.value
    default:
      return false
  }
})

// Methods
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const getAdGroupStatusClass = (status) => {
  const statusClasses = {
    ENABLE: 'text-success',
    PAUSED: 'text-warning',
    DISABLE: 'text-danger',
    PENDING: 'text-info',
  }
  return statusClasses[status] || 'text-muted'
}

const getLocationName = (locationId) => {
  const location = availableLocations.value.find(loc => loc.location_id === locationId)
  return location ? location.name : locationId
}

const getInterestName = (interestId) => {
  const interest = availableInterests.value.find(int => int.interest_category_id === interestId)
  return interest ? interest.interest_category_name : interestId
}

const getLanguageName = (languageCode) => {
  const language = availableLanguages.value.find(lang => lang.language_code === languageCode)
  return language ? language.language : languageCode
}

// Targeting methods
const togglePlacement = (placement) => {
  const index = adGroupForm.value.placements.indexOf(placement)
  if (index > -1) {
    adGroupForm.value.placements.splice(index, 1)
  } else {
    adGroupForm.value.placements.push(placement)
  }
}

const toggleAgeGroup = (ageGroup) => {
  const index = adGroupForm.value.age_groups.indexOf(ageGroup)
  if (index > -1) {
    adGroupForm.value.age_groups.splice(index, 1)
  } else {
    adGroupForm.value.age_groups.push(ageGroup)
  }
}

const toggleGender = (gender) => {
  const index = adGroupForm.value.genders.indexOf(gender)
  if (index > -1) {
    adGroupForm.value.genders.splice(index, 1)
  } else {
    adGroupForm.value.genders.push(gender)
  }
}

const addLocation = () => {
  if (selectedLocation.value && !adGroupForm.value.locations.includes(selectedLocation.value)) {
    adGroupForm.value.locations.push(selectedLocation.value)
    selectedLocation.value = ''
  }
}

const removeLocation = (locationId) => {
  const index = adGroupForm.value.locations.indexOf(locationId)
  if (index > -1) {
    adGroupForm.value.locations.splice(index, 1)
  }
}

const addInterest = () => {
  if (selectedInterest.value && !adGroupForm.value.interests.includes(selectedInterest.value)) {
    adGroupForm.value.interests.push(selectedInterest.value)
    selectedInterest.value = ''
  }
}

const removeInterest = (interestId) => {
  const index = adGroupForm.value.interests.indexOf(interestId)
  if (index > -1) {
    adGroupForm.value.interests.splice(index, 1)
  }
}

const addLanguage = () => {
  if (selectedLanguage.value && !adGroupForm.value.languages.includes(selectedLanguage.value)) {
    adGroupForm.value.languages.push(selectedLanguage.value)
    selectedLanguage.value = ''
  }
}

const removeLanguage = (languageCode) => {
  const index = adGroupForm.value.languages.indexOf(languageCode)
  if (index > -1) {
    adGroupForm.value.languages.splice(index, 1)
  }
}

// Ad Group actions
const startAdGroup = async (adGroupId) => {
  const success = await store.updateAdGroupStatus(adGroupId, 'ENABLE')
  if (success) {
    console.log('Ad Group started successfully')
  }
}

const pauseAdGroup = async (adGroupId) => {
  const success = await store.updateAdGroupStatus(adGroupId, 'DISABLE')
  if (success) {
    console.log('Ad Group paused successfully')
  }
}

const deleteAdGroup = async (adGroupId, adGroupName) => {
  const confirmed = confirm(`Are you sure you want to delete the ad group "${adGroupName}"?\n\nThis action cannot be undone.`)
  
  if (confirmed) {
    const success = await store.updateAdGroupStatus(adGroupId, 'DELETE')
    if (success) {
      console.log('Ad Group deleted successfully')
      alert(`Ad Group "${adGroupName}" has been deleted successfully.`)
    } else {
      alert(`Failed to delete ad group "${adGroupName}". Please try again.`)
    }
  }
}

const refreshAdGroupData = async () => {
  if (props.campaignId) {
    console.log(`refreshAdGroupData: Starting refresh for campaign ${props.campaignId}`)
    console.log('refreshAdGroupData: Ad groups before refresh:', store.adGroups.length)
    
    // Принудительно очищаем данные перед загрузкой новых
    store.adGroups = []
    store.adGroupStats = {
      active: 0,
      totalSpend: '0.00',
      impressions: 0,
      clicks: 0
    }
    
    console.log('refreshAdGroupData: Ad groups cleared, now loading new data...')
    await store.loadAdGroupData(props.campaignId)
    
    console.log('refreshAdGroupData: Ad groups after refresh:', store.adGroups.length)
    console.log('refreshAdGroupData: Final ad groups list:', store.adGroups.map(ag => ({ 
      id: ag.adgroup_id, 
      name: ag.adgroup_name, 
      campaign_id: ag.campaign_id 
    })))
  }
}

const openCreateAdGroup = () => {
  const createAccordion = document.getElementById('adGroupCreatorCollapse')
  if (createAccordion && !createAccordion.classList.contains('show')) {
    const createButton = document.querySelector('[data-bs-target="#adGroupCreatorCollapse"]')
    createButton?.click()
  }
}

// Form methods
const validateAdGroupForm = () => {
  const errors = {}
  const form = adGroupForm.value

  if (!form.adgroup_name.trim()) {
    errors.adgroup_name = 'Ad Group name is required'
  } else if (form.adgroup_name.length < 3) {
    errors.adgroup_name = 'Ad Group name must be at least 3 characters'
  }

  if (!form.placements.length) {
    errors.placements = 'At least one placement is required'
  }

  if (!form.budget_mode) {
    errors.budget_mode = 'Budget type is required'
  }

  if (!form.budget || form.budget < 20) {
    errors.budget = 'Budget must be at least $20'
  }

  adGroupFormErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleCreateAdGroup = async () => {
  if (currentFormStep.value !== totalFormSteps.value) {
    return
  }

  adGroupCreationMessage.value = ''
  adGroupCreationSuccess.value = false

  if (!validateAdGroupForm()) {
    adGroupCreationMessage.value = 'Please fix the form errors before submitting'
    adGroupCreationSuccess.value = false
    return
  }

  isCreatingAdGroup.value = true

  try {
    const form = adGroupForm.value

    // Устанавливаем время начала в UTC (через минуту для безопасности)
    const startTime = new Date()
    startTime.setMinutes(startTime.getMinutes() + 1) // Добавляем минуту для безопасности
    const schedule_start_time = startTime.toISOString().replace('T', ' ').slice(0, 19) // Формат: YYYY-MM-DD HH:MM:SS в UTC

    const adGroupData = {
      adgroup_name: form.adgroup_name.trim(),
      campaign_id: props.campaignId,
      placements: form.placements,
      budget_mode: form.budget_mode,
      budget: parseFloat(form.budget),
      bid_type: form.bid_type,
      bid_price: form.bid_type === 'BID_TYPE_CUSTOM' ? parseFloat(form.bid_price || 1.0) : undefined,
      pacing: form.pacing || 'PACING_MODE_SMOOTH', // Delivery pacing strategy
      schedule_type: 'SCHEDULE_FROM_NOW', // Обязательное поле для TikTok API
      schedule_start_time: schedule_start_time, // Обязательное поле
      optimization_goal: form.optimization_goal || 'CLICK', // Используем выбранную цель или fallback
      billing_event: form.billing_event || 'CPC', // Используем выбранную модель оплаты или fallback
      operation_status: 'ENABLE', // Статус Ad Group (ENABLE, DISABLE)
      promotion_type: form.promotion_type || 'WEBSITE' // Тип продвижения
    }

    // Add targeting if specified
    if (form.age_groups.length > 0) {
      adGroupData.age_groups = form.age_groups
    }
    if (form.genders.length > 0) {
      adGroupData.genders = form.genders
    }
    if (form.languages.length > 0) {
      adGroupData.languages = form.languages
    }
    
    // Locations are REQUIRED by TikTok API (must be strings according to docs)
    if (form.locations.length > 0) {
      // Extract location IDs from selected locations and ensure they're strings
      adGroupData.location_ids = form.locations.map(loc => String(loc.location_id || loc.id || loc))
      console.log('Using selected locations:', adGroupData.location_ids)
    } else {
      // Fallback to first available location from API metadata (required field)
      const availableLocs = availableLocations.value
      if (availableLocs.length > 0) {
        const firstLocation = availableLocs[0]
        adGroupData.location_ids = [String(firstLocation.location_id || firstLocation.id)]
        console.log('No locations selected, using first available location:', firstLocation.name, adGroupData.location_ids[0])
      } else {
        // Ultimate fallback - ensure it's a string array
        adGroupData.location_ids = ['6252001'] // United States as string
        console.log('No API locations available, using hardcoded fallback: United States (as string)')
      }
    }

    console.log('Creating ad group with data:', adGroupData)
    console.log('schedule_start_time formatted as:', schedule_start_time)

    const success = await store.createAdGroup(adGroupData)

    if (success) {
      adGroupCreationMessage.value = `Ad Group "${adGroupData.adgroup_name}" created successfully!`
      adGroupCreationSuccess.value = true
      
      // The store already refreshes the list in createAdGroup, but let's force a component refresh
      console.log('Ad Group created successfully. Current count:', store.adGroups.length)
      
      // Small delay to ensure the API response is processed
      setTimeout(async () => {
        console.log('Double-checking ad groups list...')
        await refreshAdGroupData()
      }, 1000)
      
      setTimeout(() => {
        resetAdGroupForm()
        adGroupCreationMessage.value = ''
        
        // Switch to overview section
        const createAccordion = document.getElementById('adGroupCreatorCollapse')
        if (createAccordion && createAccordion.classList.contains('show')) {
          const createButton = document.querySelector('[data-bs-target="#adGroupCreatorCollapse"]')
          createButton?.click()
        }

        const overviewAccordion = document.getElementById('adGroupOverviewCollapse')
        if (overviewAccordion && !overviewAccordion.classList.contains('show')) {
          const overviewButton = document.querySelector('[data-bs-target="#adGroupOverviewCollapse"]')
          overviewButton?.click()
        }
      }, 3000)
    } else {
      adGroupCreationMessage.value = store.error || 'Failed to create ad group. Please try again.'
      adGroupCreationSuccess.value = false
    }
  } catch (error) {
    console.error('Error creating ad group:', error)
    adGroupCreationMessage.value = error.message || 'An unexpected error occurred while creating the ad group.'
    adGroupCreationSuccess.value = false
  } finally {
    isCreatingAdGroup.value = false
  }
}

const nextStep = () => {
  if (currentFormStep.value < totalFormSteps.value && isStepValid.value) {
    currentFormStep.value++
  }
}

const resetAdGroupForm = () => {
  adGroupForm.value = {
    adgroup_name: '',
    campaign_id: props.campaignId,
    placements: ['PLACEMENT_TIKTOK'],
    budget_mode: '',
    budget: 20,
    bid_type: 'BID_TYPE_CUSTOM',
    bid_price: 1.0,
    pacing: 'PACING_MODE_SMOOTH',
    age_groups: [],
    genders: [],
    locations: [],
    interests: [],
    languages: [],
    optimization_goal: 'CLICK',
    billing_event: 'CPC',
    promotion_type: 'WEBSITE',
    schedule_start_time: '',
    schedule_end_time: ''
  }
  
  adGroupFormErrors.value = {}
  adGroupCreationMessage.value = ''
  adGroupCreationSuccess.value = false
  currentFormStep.value = 1
  selectedLocation.value = ''
  selectedInterest.value = ''
  selectedLanguage.value = ''
}

// Watch for campaign changes
watch(() => props.campaignId, (newCampaignId, oldCampaignId) => {
  if (newCampaignId && newCampaignId !== oldCampaignId) {
    console.log('Campaign changed from', oldCampaignId, 'to', newCampaignId, '- clearing ad groups and reloading')
    
    // Очищаем текущие группы объявлений перед загрузкой новых
    store.adGroups = []
    store.adGroupStats = {
      active: 0,
      totalSpend: '0.00',
      impressions: 0,
      clicks: 0
    }
    
    store.setSelectedCampaignId(newCampaignId)
    adGroupForm.value.campaign_id = newCampaignId
    refreshAdGroupData()
  }
})

// Watch for advertiser account changes
watch(() => store.selectedAdvertiserId, async (newAdvertiserId, oldAdvertiserId) => {
  if (newAdvertiserId && newAdvertiserId !== oldAdvertiserId && props.campaignId) {
    console.log('Advertiser changed in Ad Group Manager - refreshing ad group data')
    await Promise.all([
      refreshAdGroupData(),
      store.getAdGroupMetadata(props.campaignId)
    ])
  }
})

// Lifecycle
onMounted(async () => {
  console.log('TikTok Ad Group Manager mounted for campaign:', props.campaignId)
  if (props.campaignId) {
    store.setSelectedCampaignId(props.campaignId)
    await Promise.all([
      refreshAdGroupData(),
      store.getAdGroupMetadata(props.campaignId) // Pass campaign_id for proper objective_type
    ])
  }
})
</script>

<style scoped>
/* Reuse Campaign Manager styles with Ad Group specific modifications */
.accordion-button:not(.collapsed) {
  background-color: var(--bs-light);
  border-color: var(--bs-border-color);
}

.accordion-button:focus {
  box-shadow: none;
  border-color: var(--bs-border-color);
}

/* Loading animation */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stat cards */
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

/* Ad Groups header */
.adgroups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.adgroups-title-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Ad Group items */
.adgroup-item-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.adgroup-actions {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.adgroup-btn {
  min-width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.adgroup-name {
  margin-bottom: 0.25rem;
  font-size: 1rem;
}

.adgroup-details {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Wizard styles */
.adgroup-creation-wizard {
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

/* Placement selection cards */
.placement-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.placement-card {
  border: 2px solid #e9ecef;
  border-radius: 0.5rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
}

.placement-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.placement-card.selected {
  border-color: #0d6efd;
  background-color: #f0f7ff;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.15);
}

.placement-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #212529;
}

.placement-desc {
  color: #6c757d;
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Age groups */
.age-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.age-card {
  border: 2px solid #e9ecef;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  display: flex;
  align-items: center;
}

.age-card:hover {
  border-color: #198754;
}

.age-card.selected {
  border-color: #198754;
  background-color: #f0fff4;
}

/* Gender options */
.gender-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.gender-card {
  border: 2px solid #e9ecef;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: white;
  display: flex;
  align-items: center;
}

.gender-card:hover {
  border-color: #fd7e14;
}

.gender-card.selected {
  border-color: #fd7e14;
  background-color: #fff4e6;
}

/* Budget cards */
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
.budget-section {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef !important;
}

.budget-section h6 {
  color: #495057;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 0.5rem;
}

/* Review section */
.adgroup-review .review-section {
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

/* Mobile responsive styles */
@media (max-width: 767.98px) {
  .placement-options {
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
  
  .age-options,
  .gender-options {
    justify-content: center;
  }
  
  .adgroup-item-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .adgroup-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}

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
  
  .adgroups-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .placement-card,
  .age-card,
  .gender-card,
  .budget-card {
    padding: 0.5rem;
  }
  
  .budget-section {
    padding: 1rem !important;
  }
}

@media (max-width: 350px) {
  .adgroups-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .create-adgroup-btn {
    width: 100%;
    font-size: 0.8rem;
  }
  
  .adgroup-btn {
    min-width: 28px;
    padding: 0.2rem 0.4rem;
    font-size: 0.8rem;
  }
  
  .adgroup-name {
    font-size: 0.9rem;
    line-height: 1.2;
  }
  
  .adgroup-details {
    font-size: 0.75rem;
    line-height: 1.3;
  }
  
  .adgroup-separator {
    display: none;
  }
  
  .adgroup-budget,
  .adgroup-status {
    display: block;
    margin: 0.1rem 0;
  }
}
</style>