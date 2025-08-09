<template>
  <div class="container">
    <!-- Dropdown with Radio Buttons -->
    <div class="d-flex align-items-center gap-3 mb-3">
      <div class="form-check">
        <input
          class="form-check-input"
          type="radio"
          name="trafficSource"
          id="tiktok"
          value="TikTok"
          v-model="store.selectedTrafficSource"
        />
        <label class="form-check-label" for="tiktok"> Tiktok </label>
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="radio"
          name="trafficSource"
          id="meta"
          value="Meta"
          v-model="store.selectedTrafficSource"
        />
        <label class="form-check-label" for="meta"> Meta </label>
      </div>

      <Multiselect
        v-model="store.selectedCampaign"
        :options="store.campaigns"
        :track-by="'id'"
        :label="'name'"
        placeholder="Select campaign"
        :searchable="true"
        :close-on-select="true"
        :allow-empty="false"
        :disabled="store.isLoadingCampaigns"
      >
        <template #option="{ option }"> {{ option.id }}_{{ option.name }} </template>
        <template #singleLabel="{ option }"> {{ option.id }}_{{ option.name }} </template>
        <template #noOptions>
          <div class="px-2 py-1 text-muted small">
            {{ store.isLoadingCampaigns ? 'Загрузка кампаний...' : 'Кампании не найдены' }}
          </div>
        </template>
      </Multiselect>
    </div>

    <!-- Action Buttons Row -->
    <div class="row mb-3">
      <div class="col-md-6">
        <button class="btn btn-primary w-100 fs-6 fw-semibold" @click="store.toggleKeywords">
          Pull keywords
        </button>
      </div>
      <div class="col-md-6">
        <button
          class="btn btn-primary w-100 fs-6 fw-semibold"
          @click="store.createClickflareOffer"
          :disabled="!store.selectedCampaign || store.isCreatingOffer"
        >
          {{ store.isCreatingOffer ? 'Creating...' : 'Add to clickflare' }}
        </button>
      </div>
    </div>

    <!-- ClickFlare сообщение -->
    <div
      v-if="store.clickflareMessage"
      class="alert mb-3"
      :class="{
        'alert-success': store.clickflareMessageType === 'success',
        'alert-danger': store.clickflareMessageType === 'error',
      }"
    >
      {{ store.clickflareMessage }}
    </div>

    <!-- URL Input Section -->
    <div class="row mb-3">
      <div class="col-md-8 position-relative">
        <input type="text" class="form-control" placeholder="Enter URL" v-model="store.urlInput" />
        <i
          v-if="store.urlInput"
          class="bi bi-x-lg position-absolute"
          style="
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
            font-size: 14px;
            cursor: pointer;
          "
          @click="store.urlInput = ''"
          title="Очистить поле"
        ></i>
      </div>
      <div class="col-md-4">
        <button
          class="btn btn-primary w-100 fs-6 fw-semibold"
          @click="store.generateKeywordsFromUrl"
          :disabled="!store.urlInput.trim() || !store.selectedCampaign"
        >
          Add from URL
        </button>
      </div>
    </div>

    <!-- Keywords Input Section -->
    <div class="row">
      <div class="col-md-8 position-relative">
        <input
          type="text"
          class="form-control"
          placeholder="Enter keyword"
          v-model="store.keywordInput"
        />
        <i
          v-if="store.keywordInput"
          class="bi bi-x-lg position-absolute"
          style="
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
            font-size: 14px;
            cursor: pointer;
          "
          @click="store.keywordInput = ''"
          title="Очистить поле"
        ></i>
      </div>
      <div class="col-md-4">
        <button
          class="btn btn-primary w-100 fs-6 fw-semibold"
          @click="store.generateKeywordsFromWords"
          :disabled="!store.keywordInput.trim() || !store.selectedCampaign"
        >
          Generate keywords
        </button>
      </div>
    </div>

    <!-- Keywords Section -->
    <div v-if="store.showKeywords" class="mt-3">
      <div v-for="(value, key, index) in store.keywords" :key="key" class="row mb-3">
        <div class="col-md-8 position-relative">
          <input
            type="text"
            class="form-control"
            :placeholder="`Enter keyword ${index + 1}`"
            v-model="store.keywords[key]"
          />
          <i
            v-if="store.keywords[key]"
            class="bi bi-x-lg position-absolute"
            style="
              right: 24px;
              top: 50%;
              transform: translateY(-50%);
              color: #6c757d;
              font-size: 14px;
              cursor: pointer;
            "
            @click="store.clearKeyword(key)"
            title="Очистить поле"
          ></i>
        </div>
        <div class="col-md-4 d-flex gap-1">
          <button
            class="btn btn-outline-secondary btn-sm flex-fill"
            @click="store.addLocationCode(key, 'city')"
          >
            + city
          </button>
          <button
            class="btn btn-outline-secondary btn-sm flex-fill"
            @click="store.addLocationCode(key, 'region')"
          >
            + region
          </button>
          <button
            class="btn btn-outline-secondary btn-sm flex-fill"
            @click="store.addLocationCode(key, 'country')"
          >
            + country
          </button>
        </div>
      </div>

      <div class="text-center mt-4">
        <div class="d-flex gap-2 justify-content-center">
          <button class="btn btn-success fs-6 fw-semibold px-4" @click="store.updateKeywords">
            Update keywords
          </button>
          <button class="btn btn-outline-danger fs-6 fw-semibold px-3" @click="store.clearAll">
            <i class="bi bi-trash me-1"></i>
            Clear Cache
          </button>
        </div>

        <!-- Сообщение об обновлении -->
        <div
          v-if="store.updateMessage"
          class="alert mt-3 mb-0"
          :class="{
            'alert-success': store.updateMessageType === 'success',
            'alert-danger': store.updateMessageType === 'error',
          }"
        >
          {{ store.updateMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useSingleOfferStore } from '../stores/singleOfferStore'
import Multiselect from 'vue-multiselect'
import 'vue-multiselect/dist/vue-multiselect.min.css'

const store = useSingleOfferStore()

// Следим за изменением traffic source
watch(
  () => store.selectedTrafficSource,
  (newSource, oldSource) => {
    // Загружаем кампании только если это реальное изменение пользователем
    if (oldSource && newSource !== oldSource) {
      store.fetchCampaigns()
    }
  }
)

// Следим за изменением выбранной кампании
watch(
  () => store.selectedCampaign,
  (newCampaign) => {
    if (newCampaign && newCampaign.id) {
      store.fetchCampaignKeywords(newCampaign.id)
      // Автоматически показываем секцию keywords
      if (!store.showKeywords) {
        store.toggleKeywords()
      }
    }
  }
)

// Загружаем кампании при монтировании
onMounted(async () => {
  // Загружаем кампании только если их еще нет или список пуст
  if (store.campaigns.length === 0) {
    await store.fetchCampaigns()
  }
})
</script>

<style>
.multiselect__option {
  padding: 8px 12px;
  transition: background-color 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.multiselect__tags {
  border-radius: 0.375rem !important;
}

.multiselect__option--highlight {
  background-color: #0d6efd !important;
  color: #fff !important;
  cursor: pointer;
}

.multiselect__option--highlight::after {
  content: none !important;
}

/* Мобильные стили */
@media (max-width: 768px) {
  .container {
    padding-left: 15px !important;
    padding-right: 15px !important;
  }

  /* Ограничиваем высоту инпутов для правильного выравнивания крестиков */
  .form-control {
    height: 38px !important;
    margin-bottom: 0.5rem;
  }

  /* Крестики теперь будут точно по центру */
  .position-relative .bi-x-lg {
    right: 24px !important;
    top: 19px !important; /* Половина от высоты инпута */
    transform: translateY(-50%) !important;
    font-size: 16px !important;
    color: #6c757d !important;
    cursor: pointer !important;
    width: 20px !important;
    height: 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Отступы между элементами */
  .row {
    margin-bottom: 1rem;
  }

  /* Отступы для кнопок */
  .btn {
    margin-bottom: 0.5rem;
  }

  /* Отступы для keyword полей */
  .row.mb-3 {
    margin-bottom: 1.5rem !important;
  }

  /* Отступы для location кнопок */
  .btn-sm {
    margin-bottom: 0.25rem;
    font-size: 0.8rem;
  }

  /* Отступы для radio кнопок */
  .form-check {
    margin-bottom: 0.5rem;
  }

  /* Multiselect отступы */
  .multiselect {
    margin-bottom: 1rem;
  }

  /* Alert отступы */
  .alert {
    margin-bottom: 1rem !important;
  }
}
</style>
