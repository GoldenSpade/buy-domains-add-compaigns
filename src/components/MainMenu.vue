<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
    <div class="container-fluid">
      <a class="navbar-brand fw-bold" href="#"> <i class="bi bi-globe2 me-2"></i>Меню </a>
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <router-link :to="{ name: 'home' }" class="nav-link" active-class="active" exact>
            <i class="bi bi-house me-1"></i> Головна
          </router-link>
        </li>
        <li class="nav-item">
          <router-link :to="{ name: 'domainsSedoAFD' }" class="nav-link" active-class="active">
            <i class="bi bi-diagram-3 me-1"></i> Sedo AFD
          </router-link>
        </li>
        <!-- <li class="nav-item">
          <router-link :to="{ name: 'createTonicCampaign' }" class="nav-link" active-class="active">
            <i class="bi bi-bar-chart-line me-1"></i> Tonic
          </router-link>
        </li> -->
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.nav-link {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.nav-link.active {
  font-weight: bold;
  color: #0d6efd !important;
}
</style>
