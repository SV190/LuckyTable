<template>
  <div>
    <div class="file-manager">
      <!-- Мобильная кнопка меню -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <!-- Мобильное затемнение -->
      <div v-if="isMobileMenuOpen" class="mobile-overlay" @click="closeMobileMenu"></div>
      
      <div class="sidebar" :class="{ 'sidebar--mobile-open': isMobileMenuOpen }">
        <div class="logo-container">
          <!-- Кнопка закрытия мобильного меню -->
          <button class="mobile-close-btn" @click="closeMobileMenu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="logo-svg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="12" r="10" fill="url(#logoGradient)" stroke="#047857" stroke-width="1"/>
              <!-- Таблица -->
              <rect x="6" y="6" width="12" height="12" fill="none" stroke="white" stroke-width="0.5"/>
              <line x1="6" y1="9" x2="18" y2="9" stroke="white" stroke-width="0.5"/>
              <line x1="6" y1="12" x2="18" y2="12" stroke="white" stroke-width="0.5"/>
              <line x1="9" y1="6" x2="9" y2="18" stroke="white" stroke-width="0.5"/>
              <line x1="12" y1="6" x2="12" y2="18" stroke="white" stroke-width="0.5"/>
              <line x1="15" y1="6" x2="15" y2="18" stroke="white" stroke-width="0.5"/>
              <!-- Текст LS -->
              <text x="12" y="15" text-anchor="middle" fill="white" font-size="8" font-weight="bold">LS</text>
            </svg>
          </div>
          <h3>LuckySheet</h3>
        </div>
        <div class="folder-tree">
          <template v-for="folder in folderTree" :key="folder.id">
            <div :class="['folder-item', { active: currentFolder === folder.id }]" @click="setCurrentFolder(folder.id)" :style="{ '--folder-color': getFolderColor(folder.id) }">
              <div class="folder-item-content">
                <div class="folder-color-dot" :style="{ backgroundColor: getFolderColor(folder.id) }">
                  <span v-if="hoveredFolderId === folder.id" class="file-count" :style="{ backgroundColor: getFolderColor(folder.id), color: getTextColorForBackground(getFolderColor(folder.id)) }">{{ getItemCountInFolder(folder) }}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="getFolderStrokeColor(getFolderColor(folder.id))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{{ folder.name }}</span>
              </div>
            </div>
            <!-- Рекурсивно отображаем дочерние папки -->
            <template v-if="folder.children && folder.children.length > 0">
              <div v-for="child in folder.children" :key="child.id" :class="['folder-item', 'folder-item--child', { active: currentFolder === child.id }]" @click="setCurrentFolder(child.id)" :style="{ '--folder-color': getFolderColor(child.id) }">
                <div class="folder-item-content">
                  <div class="folder-color-dot" :style="{ backgroundColor: getFolderColor(child.id) }">
                    <span v-if="hoveredFolderId === child.id" class="file-count" :style="{ backgroundColor: getFolderColor(child.id), color: getTextColorForBackground(getFolderColor(child.id)) }">{{ getItemCountInFolder(child) }}</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="getFolderStrokeColor(getFolderColor(child.id))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>{{ child.name }}</span>
                </div>
              </div>
            </template>
          </template>
          <!-- Кнопка создания папки видна только администраторам -->
          <button v-if="isAdmin" @click="addFolder" class="add-folder-btn styled-add-folder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Новая папка</span>
          </button>
        </div>
        <div class="sidebar-footer">
          <div v-if="isDropboxAuthenticated && storageInfo" class="storage-info">
            <div class="storage-text">
              <span>{{ storageInfo.usedGB }}</span>
              <span class="storage-separator">/</span>
              <span>{{ storageInfo.totalGB }}</span>
            </div>
            <div class="storage-bar">
              <div class="storage-used" :style="{ width: storageInfo.percentage + '%' }"></div>
            </div>
            <div class="storage-label">Dropbox</div>
          </div>
          <div v-if="user" class="user-block" style="margin-top: 18px;">
            <div class="user-avatar">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a7.5 7.5 0 0 1 13 0"/>
              </svg>
            </div>
            <div class="user-info">
              <div class="username">{{ user.username }}</div>
              <div v-if="isAdmin" class="role-badge">Админ</div>
            </div>
          </div>
          <button v-if="isAdmin" @click="handleGoToAdmin" class="sidebar-btn admin-panel-link" style="margin-top: 12px; width: 100%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Админ-панель
          </button>
          <button class="sidebar-btn logout" @click="handleLogout" style="margin-top: 16px; width: 100%;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Выйти
          </button>
        </div>
      </div>
      <div class="main-content">
        <div class="main-header">
          <div class="main-header-left">
            <button v-if="currentFolder !== 'root'" class="back-btn" @click="goBack">
              <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <h2 class="header-title">{{ folderTitle }}</h2>
          </div>
          <div class="header-actions">
            <!-- Удалён input type=file и кнопка загрузки -->
          </div>
        </div>

        <div class="breadcrumb">
          <span v-for="(crumb, idx) in getBreadcrumbs" :key="crumb.id">
            <span class="breadcrumb-link" @click="goToFolder(crumb.id)">{{ crumb.name }}</span>
            <span v-if="idx < getBreadcrumbs.length - 1" class="breadcrumb-sep">/</span>
          </span>
        </div>

        <div class="search-and-view-controls">
          <div class="search-bar">
            <input v-model="searchQuery" type="text" placeholder="Поиск файлов и папок..." />
          </div>
          <div class="view-mode-controls">
            <button 
              class="view-mode-btn" 
              :class="{ active: viewMode === 'grid' }" 
              @click="viewMode = 'grid'" 
              title="Режим сетки">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button 
              class="view-mode-btn" 
              :class="{ active: viewMode === 'list' }" 
              @click="viewMode = 'list'" 
              title="Режим списка">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div :class="['file-container', viewMode === 'grid' ? 'tile-grid' : 'list-view']" @contextmenu="showEmptySpaceContextMenu">
          <div v-if="isLoadingFiles" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Загрузка файлов из Dropbox...</p>
          </div>
          <template v-else>
            <div v-for="folder in filteredFolders" :key="'folder-' + folder.id" class="tile tile--folder" @click="setCurrentFolder(folder.id)" @mouseenter="fetchItemCountForFolder(folder); hoveredFolderId = folder.id" @mouseleave="hoveredFolderId = null" :style="{ '--folder-border-color': getFolderColor(folder.id) }" @contextmenu.stop="showFolderContextMenu($event, folder)">
              <div class="tile-icon tile-icon--folder" :style="{ backgroundColor: hoveredFolderId === folder.id ? getFolderHoverBgColor(getFolderColor(folder.id)) : getFolderBgColor(getFolderColor(folder.id)) }">
                <span v-if="hoveredFolderId === folder.id && loadingCounts[folder.id]" class="file-count" :style="{ backgroundColor: getFolderColor(folder.id), color: getTextColorForBackground(getFolderColor(folder.id)) }">{{ getItemCountInFolder(folder) }}</span>
                <span v-else-if="hoveredFolderId === folder.id" class="file-count" :style="{ backgroundColor: getFolderColor(folder.id), color: getTextColorForBackground(getFolderColor(folder.id)) }">{{ countsByFolderId[folder.id] ?? 0 }}</span>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" :stroke="getFolderStrokeColor(getFolderColor(folder.id))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div class="tile-name" :title="folder.name">{{ folder.name }}</div>
              <div v-if="viewMode === 'list'" class="tile-details">
                <div class="tile-folder-count">{{ countsByFolderId[folder.id] ?? 0 }} элем.</div>
              </div>
            </div>
            <div v-for="file in filteredFiles" :key="'file-' + file.id" class="tile tile--file" @click="openFile(file)">
              <div class="tile-icon tile-icon--table">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V3"/>
                </svg>
              </div>
              <div class="tile-name" :title="file.name">{{ file.name }}</div>
              <div v-if="viewMode === 'list'" class="tile-details">
                <div class="tile-date">{{ formatDate(file.updatedAt) }}</div>
                <div v-if="file.size" class="tile-size">{{ formatSize(file.size) }}</div>
              </div>
            </div>
            <div v-if="filteredFolders.length === 0 && filteredFiles.length === 0" class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              <p>Нет файлов в этой папке</p>
              <!-- Кнопка создания папки видна только администраторам -->
              <button v-if="isAdmin" class="btn btn-primary" @click="showCreateFolderModal = true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Создать папку
              </button>
            </div>
          </template>
        </div>
      </div>

      <div v-if="showMoveFileModal" class="modal-overlay" @click="closeMoveModal">
        <div class="modal-content move-modal" @click.stop>
          <div class="modal-header">
            <h3>Переместить файл</h3>
            <button @click="closeMoveModal" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="file-info">
              <div class="file-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V3"/>
                </svg>
              </div>
              <div class="file-details">
                <div class="file-name">{{ fileToMove?.name }}</div>
                <div class="file-path">{{ fileToMove?.path }}</div>
              </div>
            </div>
            
            <div class="section-title">Выберите папку назначения:</div>
            
            <div class="folder-grid">
              <div v-for="folder in (Array.isArray(folders) ? folders : []).filter(f => f.path !== (fileToMove?.path ? fileToMove.path.substring(0, fileToMove.path.lastIndexOf('/')) : ''))" :key="folder.id" class="folder-card" @click="handleMoveToFolder(folder)">
                <div class="folder-icon">
                  <div class="folder-color-circle-modal" :style="{ backgroundColor: getFolderColor(folder.id) }"></div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" :stroke="getFolderStrokeColor(getFolderColor(folder.id))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-path">{{ folder.path || 'Корневая папка' }}</div>
              </div>
            </div>
            
            <div class="modal-actions">
              <button @click="closeMoveModal" class="btn btn-secondary">Отмена</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Контекстное меню (только для администраторов) -->
      <div v-if="folderContextMenu.show && isAdmin" class="context-menu" :style="{ left: folderContextMenu.x + 'px', top: folderContextMenu.y + 'px' }">
        <div class="context-menu-item" @click="renameFolder(folderContextMenu.folder)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          <span>Переименовать</span>
        </div>
        <div class="context-menu-item" @click="moveFolder(folderContextMenu.folder)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
          <span>Переместить</span>
        </div>
        <div v-if="folderContextMenu.folder?.id !== 'root'" class="context-menu-item context-menu-item--danger" @click="deleteFolderFromContext(folderContextMenu.folder)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
          </svg>
          <span>Удалить</span>
        </div>
      </div>

      <!-- Контекстное меню для пустого места (только для администраторов) -->
      <div v-if="emptySpaceContextMenu.show && isAdmin" class="context-menu" :style="{ left: emptySpaceContextMenu.x + 'px', top: emptySpaceContextMenu.y + 'px' }">
        <div class="context-menu-item" @click="createFolderFromContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Создать папку</span>
        </div>
      </div>

      <!-- Модальное окно создания папки -->
      <div v-if="showCreateFolderModal" class="modal-overlay" @click="closeCreateFolderModal">
        <div class="modal modal--create-folder" @click.stop>
          <div class="modal-header">
            <h3>Создать новую папку</h3>
            <button @click="closeCreateFolderModal" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="folderName">Название папки:</label>
              <input 
                id="folderName" 
                v-model="newFolderName" 
                type="text" 
                placeholder="Введите название папки"
                @keyup.enter="createFolder"
                required 
              />
            </div>
            

            
            <div class="folder-preview">
              <div class="preview-label">Предварительный просмотр:</div>
              <div class="preview-folder">
                <div class="folder-item-content">
                  <div class="folder-color-dot"></div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>{{ newFolderName || 'Название папки' }}</span>
                </div>
              </div>
            </div>
            
            <div class="modal-actions">
              <button @click="closeCreateFolderModal" class="btn btn-secondary">Отмена</button>
              <button @click="createFolder" class="btn btn-primary" :disabled="!newFolderName.trim()">Создать</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно редактирования папки -->
      <div v-if="showEditFolderModal" class="modal-overlay" @click="closeEditFolderModal">
        <div class="modal-content edit-modal" @click.stop>
          <div class="modal-header">
            <h3>Редактировать папку</h3>
            <button @click="closeEditFolderModal" class="close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="editFolderName">Название папки:</label>
              <input 
                id="editFolderName" 
                v-model="editFolderName" 
                type="text" 
                placeholder="Введите новое название папки"
                @keyup.enter="saveFolder"
                required 
              />
            </div>
            

            
            <div class="folder-preview">
              <div class="preview-label">Предварительный просмотр:</div>
              <div class="preview-folder">
                <div class="folder-item-content">
                  <div class="folder-color-dot"></div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>{{ editFolderName || 'Название папки' }}</span>
                </div>
              </div>
            </div>
            
            <div class="modal-actions">
              <button @click="closeEditFolderModal" class="btn btn-secondary">Отмена</button>
              <button @click="saveFolder" class="btn btn-primary" :disabled="!editFolderName.trim()">Сохранить</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Модальное окно перемещения папки -->
      <div v-if="showMoveFolderModal" class="modal-overlay" @click="closeMoveFolderModal">
        <div class="modal modal--move-folder" @click.stop>
          <div class="modal-header">
            <h3>Переместить папку "{{ folderToMove?.name }}"</h3>
            <button class="modal-close" @click="closeMoveFolderModal">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-description">Выберите папку назначения:</p>
            <div class="folder-list">
              <div class="folder-item folder-item--root" @click="handleMoveFolderToFolder({ id: 'root', name: 'Корневая папка', path: '' })">
                <div class="folder-icon folder-icon--root">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <span>Корневая папка</span>
              </div>
              <div v-for="folder in (Array.isArray(folders) ? folders : []).filter(f => f.id !== folderToMove?.id)" :key="folder.id" class="folder-item" @click="handleMoveFolderToFolder(folder)">
                <div class="folder-icon" :style="{ backgroundColor: getFolderBgColor(getFolderColor(folder.id)) }">
                  <div class="folder-color-circle" :style="{ backgroundColor: getFolderColor(folder.id) }"></div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" :stroke="getFolderStrokeColor(getFolderColor(folder.id))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <span>{{ folder.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isOpeningFile" class="global-loading-overlay">
        <div class="global-loading-spinner"></div>
        <div class="global-loading-text">Загрузка таблицы...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import LuckyExcel from 'luckyexcel'
import { dropboxStorage } from '../utils/dropboxStorage.js'
import { useAuth } from '../composables/useAuth.js'
import { useDropbox } from '../composables/useDropbox.js'
import { initializeDropboxIfNeeded } from '../composables/useDropboxInit.js'
import { safeBase64ToUint8Array, base64ToBlob, base64ToFile } from '../utils/base64Utils.js'

const { user, isAdmin, logout } = useAuth()
const emit = defineEmits(['openFile', 'logout', 'goToAdmin'])

const { isDropboxAuthenticated, folders, files, loadDropboxFolders, loadDropboxFiles, loadDropboxData, loadAllDropboxData } = useDropbox()

const currentFolder = ref('root')
const isDragOver = ref(false)
const storageType = ref('local')
const isLoadingFiles = ref(false)
const showMoveFileModal = ref(false)
const fileToMove = ref(null)
const searchQuery = ref('')
const storageInfo = ref(null)
const viewMode = ref(localStorage.getItem('fileViewMode') || 'grid') // 'grid' или 'list'

// Состояние для контекстного меню папок
const folderContextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  folder: null
})

// Состояние для контекстного меню пустого места
const emptySpaceContextMenu = ref({
  show: false,
  x: 0,
  y: 0
})

// Состояние для модального окна создания папки
const showCreateFolderModal = ref(false)
const newFolderName = ref('')

// Состояние для модального окна редактирования папки
const showEditFolderModal = ref(false)
const editingFolder = ref(null)
const editFolderName = ref('')

// Состояние для модального окна перемещения папки
const showMoveFolderModal = ref(false)
const folderToMove = ref(null)

// Состояние для раскрытых папок
const expandedFolders = ref(['root'])

// Состояние для мобильного меню
const isMobileMenuOpen = ref(false)

const folderTitle = computed(() => {
    if (currentFolder.value === 'all') return 'Все файлы'
    if (currentFolder.value === 'recent') return 'Недавние'
    if (currentFolder.value === 'favorites') return 'Избранное'
    return 'Файлы'
})

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Построение дерева папок
function buildFolderTree(folders) {
  const map = {}
  const roots = []
  
  // Сначала создаем все узлы
  folders.forEach(folder => {
    map[folder.id] = { ...folder, children: [] }
  })
  
  // Затем строим связи
  folders.forEach(folder => {
    if (folder.id === 'root') {
      // root - корневая папка
      return
    }
    
    if (folder.path && folder.path.includes('/')) {
      // вложенная папка
      const pathParts = folder.path.split('/').filter(p => p)
      if (pathParts.length > 1) {
        // есть родительская папка
        const parentPath = '/' + pathParts.slice(0, -1).join('/')
        const parent = (Array.isArray(folders) ? folders : []).find(f => f.path === parentPath)
        if (parent) {
          map[parent.id].children.push(map[folder.id])
        } else {
          roots.push(map[folder.id])
        }
      } else {
        // папка в корне
        roots.push(map[folder.id])
      }
    } else {
      // папка в корне
      roots.push(map[folder.id])
    }
  })
  
  // root всегда первый, с детьми
  if (map['root']) {
    map['root'].children = roots
    return [map['root']]
  }
  return roots
}

const folderTree = computed(() => buildFolderTree(folders.value))

// Функция для получения стандартного цвета папки
const getFolderColor = () => {
  return '#FEF3C7' // стандартный цвет для всех папок
}

// Заглушка для функции сохранения цвета папки
const saveFolderColor = () => {
  // Ничего не делаем, так как кастомные цвета отключены
}

// Функция для подсчета файлов и папок в папке (актуализированная)
const getItemCountInFolder = (folder) => {
  // Получаем все файлы и папки, которые лежат непосредственно в этой папке
  const folderPath = folder.path;
  // Файлы только первого уровня
  const filesInFolder = (Array.isArray(files.value) ? files.value : []).filter(file => {
    if (!file.path) return false;
    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    return parentPath === folderPath;
  }).length;
  // Папки только первого уровня
  const foldersInFolder = (Array.isArray(folders.value) ? folders.value : []).filter(f => {
    if (f.id === 'root' || f.path === folderPath) return false;
    const parentPath = f.path.substring(0, f.path.lastIndexOf('/'));
    return parentPath === folderPath;
  }).length;
  return filesInFolder + foldersInFolder;
};

const handleFileUpload = (event) => processFiles(Array.from(event.target.files));
const processFiles = (fileList) => {
    fileList.forEach(file => {
        if ((file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) && (file instanceof File || file.constructor.name === 'File')) {
            
            // Если Dropbox подключен, конвертируем и загружаем
            if (isDropboxAuthenticated.value && storageType.value === 'dropbox') {
                LuckyExcel.transformExcelToLucky(file, async (exportJson, msg) => {
                    if (exportJson.sheets == null || exportJson.sheets.length === 0) {
                        alert('Не удалось прочитать файл: ' + msg);
                        return;
                    }

                    // Сохраняем в Dropbox с расширением .xlsx
                    const xlsxFileName = file.name.endsWith('.xlsx') ? file.name : `${file.name.replace(/\.(xls)$/, '')}.xlsx`;

                    try {
                        await saveToDropbox(xlsxFileName, exportJson);
                        alert(`Файл "${file.name}" успешно загружен в Dropbox.`);
                    } catch (error) {
                        alert(`Ошибка загрузки файла "${file.name}" в Dropbox.`);
                        console.error(error);
                    }
                });
            } else {
                // Иначе просто добавляем в локальный список для открытия
                const newFile = { id: generateId(), name: file.name, size: file.size, lastModified: new Date(), isFavorite: false, file, type: 'excel' };
                files.value.unshift(newFile);
            }
        }
    });
};

const handleDragEnter = () => isDragOver.value = true;
const handleDragLeave = () => isDragOver.value = false;
const handleFileUploadDrop = (e) => {
    isDragOver.value = false;
    processFiles(Array.from(e.dataTransfer.files));
};
const triggerFileUpload = () => document.getElementById('fileUpload').click();
const isOpeningFile = ref(false)

const openFile = async (file) => {
  // Закрываем мобильное меню при открытии файла
  closeMobileMenu();
  
  isOpeningFile.value = true
  try {
    if (file.type === 'new') {
      emit('openFile', { name: file.name, path: file.path || '', data: null, isNew: true });
    } else if (file.type === 'cloud') {
      if (!file.path) {
        alert('Ошибка: у файла нет пути!');
        console.error('Открытие файла: отсутствует file.path', file);
        return;
      }
      const fileData = await loadFromDropbox(file.path)
      emit('openFile', { name: file.name, path: file.path, data: fileData, isNew: false });
    } else if (file.file) {
      LuckyExcel.transformExcelToLucky(file.file, (exportJson) => {
        if (exportJson.sheets == null || exportJson.sheets.length === 0) {
          alert('Не удалось прочитать файл');
          isOpeningFile.value = false
          return;
        }
        emit('openFile', { name: file.name, path: file.path || '', data: exportJson, isNew: false });
      });
    } else if (file.savedData) {
       const fileData = JSON.parse(JSON.stringify(file));
       if (fileData.savedData && fileData.savedData.sheets) {
         emit('openFile', { name: fileData.name, path: fileData.path || '', data: fileData.savedData, isNew: false });
       }
    }
  } finally {
    isOpeningFile.value = false
  }
};
const toggleFavorite = (file) => file.isFavorite = !file.isFavorite;
const deleteFile = async (file) => {
  // Только администраторы могут удалять файлы
  if (!isAdmin.value) {
    alert('У вас нет прав для удаления файлов')
    return
  }
  
  if (confirm(`Удалить "${file.name}"?`)) {
    try {
      if (file.type === 'cloud') {
        await deleteFromDropbox(file.path)
        
        // Обновляем локальный список файлов
        await loadDropboxFiles()
        
        // Также удаляем файл из локального массива
        const fileIndex = files.value.findIndex(f => f.id === file.id)
        if (fileIndex !== -1) {
          files.value.splice(fileIndex, 1)
        }
      } else {
        files.value = Array.isArray(files.value) ? files.value.filter(f => f.id !== file.id) : [];
      }
      
      // Закрываем контекстное меню если оно открыто
      hideContextMenu()
      
    } catch (error) {
      console.error('Ошибка удаления файла:', error)
      alert('Ошибка удаления файла: ' + error.message)
    }
  }
};
const setCurrentFolder = (folderId) => {
  // Проверяем, существует ли папка с таким ID
  if (!(Array.isArray(folders.value) ? folders.value : []).find(f => f.id === folderId)) {
    currentFolder.value = 'root';
  } else {
    currentFolder.value = folderId;
  }
  
  console.log('Выбрана папка:', folderId);
  
  // Закрываем мобильное меню при выборе папки
  closeMobileMenu();
};
const filteredFiles = computed(() => {
  const allFiles = Array.isArray(files.value) ? files.value : [];
  const allFolders = Array.isArray(folders.value) ? folders.value : [];
  const folder = allFolders.find(f => f.id === currentFolder.value) || allFolders[0];
  let result = [];
  
  if (!folder) {
    return [];
  }
  
  // Если мы в корневой папке, показываем только файлы в корне
  if (folder.path === '') {
    result = allFiles.filter(file => {
      const filePath = file.path || '';
      // Проверяем, что файл находится в корне
      if (!filePath.includes('/') || filePath.lastIndexOf('/') === 0) {
        return true;
      }
      return false;
    });
  } else {
    // Для вложенных папок показываем только файлы, которые находятся непосредственно в этой папке
    result = allFiles.filter(file => {
      const filePath = file.path || '';
      // Проверяем, что файл находится в текущей папке
      if (filePath.startsWith(folder.path + '/')) {
        // Получаем путь без имени файла
        const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
        // Файл находится непосредственно в текущей папке, если путь совпадает
        return fileDir === folder.path;
      }
      return false;
    });
  }
  
  // Фильтруем файл users.json - он не должен отображаться никому
  result = result.filter(file => file.name !== 'users.json');
  
  // Применяем поиск, если есть запрос
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    result = result.filter(f => f.name.toLowerCase().includes(q));
  }
  
  return result;
});
const filteredFolders = computed(() => {
  const allFolders = Array.isArray(folders.value) ? folders.value : [];
  const currentFolderObj = allFolders.find(f => f.id === currentFolder.value) || allFolders[0];
  const currentPath = currentFolderObj ? currentFolderObj.path : '';
  
  // Получаем все папки, которые находятся непосредственно внутри текущей папки
  let result = allFolders.filter(f => {
    // Исключаем корневую папку из списка
    if (f.id === 'root') return false;
    
    // Если мы в корневой папке, показываем только папки первого уровня
    if (currentFolder.value === 'root') {
      // Проверяем, что путь имеет только один сегмент (например, '/folder')
      const segments = f.path.split('/').filter(Boolean);
      return segments.length === 1;
    }
    
    // Для вложенных папок
    if (currentPath) {
      // Получаем родительский путь для текущей папки
      const parentPath = f.path.substring(0, f.path.lastIndexOf('/'));
      // Проверяем, что родительский путь совпадает с текущим путем
      return parentPath === currentPath;
    }
    
    return false;
  });
  
  // Применяем поиск, если есть запрос
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    result = result.filter(f => f.name.toLowerCase().includes(q));
  }
  
  return result;
});
const formatDate = (date) => {
  try {
    if (!date) return 'Неизвестно';
    
    // Проверяем, является ли date валидной датой
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Неизвестно';
    }
    
    return new Intl.DateTimeFormat('ru-RU').format(dateObj);
  } catch (error) {
    console.error('Ошибка форматирования даты:', error, date);
    return 'Неизвестно';
  }
};

// Функция для форматирования размера файла
const formatSize = (bytes) => {
  if (bytes === undefined || bytes === null) return '';
  
  if (bytes < 1024) {
    return bytes + ' байт';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' КБ';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' ГБ';
  }
};

// Dropbox Storage handlers
const initializeStorage = async () => {
  try {
    const isAuth = await dropboxStorage.initialize()
    isDropboxAuthenticated.value = isAuth
    if (isAuth) {
      storageType.value = 'dropbox'
      await loadDropboxFolders()
    } else {
      // Если Dropbox не авторизован, загружаем локальные файлы
      loadFiles()
    }
  } catch (error) {
    console.error('Ошибка инициализации Dropbox:', error)
    // В случае ошибки загружаем локальные файлы
    loadFiles()
  }
}

const loadStorageInfo = async () => {
  if (storageType.value === 'dropbox' && isDropboxAuthenticated.value) {
    try {
      const userInfo = await dropboxStorage.getUserInfo()
      
      if (userInfo) {
        const usedBytes = userInfo.spaceUsed
        const totalBytes = userInfo.spaceTotal
        
        const formatSize = (bytes) => {
          if (bytes >= 1024 * 1024 * 1024) {
            return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
          } else if (bytes >= 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
          } else if (bytes >= 1024) {
            return (bytes / 1024).toFixed(1) + ' KB'
          } else {
            return bytes + ' B'
          }
        }
        
        const usedFormatted = formatSize(usedBytes)
        const totalFormatted = formatSize(totalBytes)
        const percentage = Math.round((usedBytes / totalBytes) * 100)
        
        storageInfo.value = {
          usedGB: usedFormatted,
          totalGB: totalFormatted,
          percentage
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о хранилище:', error)
      // Для тестирования используем заглушку
      storageInfo.value = {
        usedGB: '100 MB',
        totalGB: '2 GB',
        percentage: 5
      }
    }
  }
}

const handleDropboxAuthChanged = async (isAuthenticated) => {
  isDropboxAuthenticated.value = isAuthenticated
  if (isAuthenticated) {
    storageType.value = 'dropbox'
    try {
      await loadDropboxFolders()
      await loadStorageInfo()
      await loadDropboxFiles() // Добавляем загрузку файлов
    } catch (error) {
      console.error('Ошибка инициализации Dropbox:', error)
      // Не выбрасываем ошибку, просто логируем
    }
  } else {
    storageType.value = 'local'
    files.value = Array.isArray(files.value) ? files.value.filter(f => f.type !== 'cloud') : []
    storageInfo.value = null
  }
}



const loadFromDropbox = async (filePath) => {
  try {
    if (!filePath) {
      throw new Error('Путь к файлу не передан!');
    }
    
    // Загружаем файл из Dropbox
    const result = await dropboxStorage.downloadFile(filePath);
    
    // Проверяем, является ли результат объектом с полем data и isBase64=true
    if (result && result.data && result.isBase64) {
      // Это Excel файл в формате base64
      console.log('Получен Excel файл в формате base64');
      
      try {
        // Используем утилиты для работы с base64
        const mimeType = result.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const fileName = result.fileName || 'file.xlsx';
        
        // Проверяем, является ли файл Excel-файлом
        if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls') ||
            mimeType.includes('excel') || mimeType.includes('spreadsheetml')) {
          
          // Создаем File объект из base64
          const file = base64ToFile(result.data, fileName, mimeType);
          
          // Преобразуем Excel файл в формат LuckySheet
          return new Promise((resolve, reject) => {
            LuckyExcel.transformExcelToLucky(file, (exportJson) => {
              if (exportJson.sheets == null || exportJson.sheets.length === 0) {
                reject(new Error('Не удалось прочитать файл'));
                return;
              }
              resolve(exportJson);
            }, (error) => {
              console.error('Ошибка преобразования Excel:', error);
              reject(new Error('Ошибка преобразования Excel: ' + error));
            });
          });
        } else {
          // Если это не Excel файл, возвращаем результат как есть
          return result;
        }
      } catch (e) {
        console.error('Ошибка обработки base64 данных:', e);
        throw new Error('Не удалось обработать файл: ' + e.message);
      }
    }
    
    // Если это не Excel файл в base64, возвращаем результат как есть
    return result;
  } catch (error) {
    console.error('Ошибка загрузки из Dropbox:', error);
    if (error.message.includes('повторная авторизация')) {
      alert('Сессия Dropbox истекла. Войдите в Dropbox снова.');
      isDropboxAuthenticated.value = false;
      storageType.value = 'local';
    }
    throw error;
  }
}

const deleteFromDropbox = async (filePath) => {
  try {
    await dropboxStorage.deleteFile(filePath)
    await loadDropboxFiles()
  } catch (error) {
    console.error('Ошибка удаления из Dropbox:', error)
    if (error.message.includes('повторная авторизация')) {
      alert('Сессия Dropbox истекла. Войдите в Dropbox снова.')
      isDropboxAuthenticated.value = false
      storageType.value = 'local'
    }
    throw error
  }
}

// Функция для сохранения файла в Dropbox
const saveToDropbox = async (fileName, fileData) => {
  try {
    const folder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === currentFolder.value)
    const path = folder ? (folder.path ? `${folder.path}/${fileName}` : `/${fileName}`) : `/${fileName}`
    await dropboxStorage.uploadFile(path, fileData)
    await loadDropboxFiles() // Перезагружаем список файлов
  } catch (error) {
    console.error('Ошибка сохранения в Dropbox:', error)
    if (error.message.includes('повторная авторизация')) {
      alert('Сессия Dropbox истекла. Войдите в Dropbox снова.')
      isDropboxAuthenticated.value = false
      storageType.value = 'local'
    }
    throw error
  }
}

// Обновляем существующие методы для работы с Dropbox
const loadFiles = () => {
  const savedFiles = localStorage.getItem('excelFiles');
  if (savedFiles) {
    try {
      const parsedFiles = JSON.parse(savedFiles);
      files.value = parsedFiles.map(file => {
        let lastModified = new Date();
        if (file.lastModified) {
          const date = new Date(file.lastModified);
          if (!isNaN(date.getTime())) {
            lastModified = date;
          }
        }
        
        return { 
          ...file, 
          id: generateId(), 
          type: 'saved',
          lastModified: lastModified
        };
      });
    } catch (error) {
      console.error('Ошибка загрузки файлов из localStorage:', error);
      files.value = [];
    }
  }
}

// Отладка модального окна
const toggleSettings = () => showSettings.value = !showSettings.value;

// Функция для очистки поврежденных данных
const clearCorruptedData = () => {
  if (confirm('Очистить все данные файлов? Это удалит все сохраненные файлы.')) {
    localStorage.removeItem('excelFiles')
    files.value = []
    alert('Данные очищены')
  }
}

const addFolder = () => {
  showCreateFolderModal.value = true
  newFolderName.value = ''
}

const closeCreateFolderModal = () => {
  showCreateFolderModal.value = false
  newFolderName.value = ''
}

const createFolder = async () => {
  if (!newFolderName.value.trim()) {
    alert('Введите название папки')
    return
  }
  // Разрешаем любые буквы, убираем только запрещённые символы Dropbox
  const safeName = newFolderName.value.trim().replace(/[\\/:?"<>|*]/g, '').replace(/\s+/g, '_')
  let parentPath = ''
  const current = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === currentFolder.value)
  if (current && current.path) {
    parentPath = current.path
  }
  const path = parentPath ? `${parentPath}/${safeName}` : `/${safeName}`
  try {
    await dropboxStorage.createFolder(path)
    await loadDropboxFolders()
    closeCreateFolderModal()
    alert('Папка успешно создана!')
  } catch (e) {
    alert('Ошибка создания папки: ' + e.message)
  }
}

const deleteFolder = async (folderId) => {
  if (folderId === 'root') return
  const folder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === folderId)
  if (!folder) return
  if (!confirm('Удалить папку и все файлы в ней?')) return
  try {
    await dropboxStorage.deleteFolder(folder.path)
    await loadDropboxFolders()
    if (currentFolder.value === folderId) currentFolder.value = 'root'
    await loadDropboxFiles()
  } catch (e) {
    alert('Ошибка удаления папки: ' + e.message)
  }
}

const openMoveModal = (file) => {
  fileToMove.value = file;
  showMoveFileModal.value = true;
};
const closeMoveModal = () => {
  showMoveFileModal.value = false
  fileToMove.value = null
}
const handleMoveToFolder = async (targetFolder) => {
  if (!fileToMove.value) return;
  try {
    const fromPath = fileToMove.value.path;
    let toPath = targetFolder.path;
    if (toPath && !toPath.endsWith('/')) toPath += '/';
    toPath += fileToMove.value.name;
    await dropboxStorage.moveFile(fromPath, toPath);
    // После перемещения обновляем список файлов для текущей папки
    const folder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === currentFolder.value);
    const path = folder ? folder.path : '';
    await loadDropboxFiles(path);
    // Закрываем модальное окно и сбрасываем fileToMove
    showMoveFileModal.value = false;
    fileToMove.value = null;
  } catch (error) {
    alert('Ошибка перемещения: ' + error.message);
  }
};

const getBreadcrumbs = computed(() => {
  const crumbs = []
  let folder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === currentFolder.value)
  while (folder) {
    crumbs.unshift({ id: folder.id, name: folder.name })
    if (!folder.path || folder.path === '') break
    // ищем родителя по пути
    const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'))
    folder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.path === parentPath)
    if (!folder && parentPath === '') {
      folder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === 'root')
    }
  }
  if (!crumbs.length || crumbs[0].id !== 'root') {
    crumbs.unshift({ id: 'root', name: 'Мои файлы' })
  }
  return crumbs
})
const goToFolder = (id) => {
  setCurrentFolder(id)
}

const handleDragStart = (event, file) => {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'file',
    id: file.id,
    name: file.name,
    path: file.path
  }));
  event.dataTransfer.effectAllowed = 'move';
};

const handleFileDrop = async (event, targetFile) => {
  event.preventDefault();
  const data = event.dataTransfer.getData('text/plain');
  if (!data) return;
  
  try {
    const draggedData = JSON.parse(data);
    if (draggedData.type === 'file' && draggedData.id !== targetFile.id) {
      // Перемещаем файл в ту же папку, где находится targetFile
      const targetFolder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === currentFolder.value);
      if (targetFolder && targetFolder.path !== '') {
        const newPath = `${targetFolder.path}/${draggedData.name}`;
        await dropboxStorage.moveFile(draggedData.path, newPath);
        await loadDropboxFiles();
      }
    }
  } catch (error) {
    console.error('Ошибка перемещения файла:', error);
  }
};

// Глобальная функция для закрытия всех модальных окон и меню
function closeAllModals() {
  hideContextMenu();
  hideFolderContextMenu();
  hideEmptySpaceContextMenu();
  showCreateFolderModal.value = false;
  showEditFolderModal.value = false;
  showMoveFileModal.value = false;
  showMoveFolderModal.value = false;
}

const hideContextMenu = () => {
  contextMenu.value.show = false
}

const hideEmptySpaceContextMenu = () => {
  emptySpaceContextMenu.value.show = false
}

const renameFile = async (file) => {
  // Только администраторы могут переименовывать файлы
  if (!isAdmin.value) {
    alert('У вас нет прав для переименования файлов')
    return
  }
  
  hideContextMenu()
  const newName = prompt('Введите новое имя файла:', file.name)
  if (!newName || newName === file.name) return
  
  try {
    const newPath = file.path.replace(file.name, newName)
    await dropboxStorage.moveFile(file.path, newPath)
    // После переименования сразу обновляем список файлов для текущей папки
    const folder = folders.value.find(f => f.id === currentFolder.value)
    const path = folder ? folder.path : ''
    await loadDropboxFiles(path)
    // Также обновляем файл в локальном массиве (опционально, если нужно мгновенное обновление)
    const fileIndex = files.value.findIndex(f => f.id === file.id)
    if (fileIndex !== -1) {
      files.value[fileIndex] = {
        ...files.value[fileIndex],
        name: newName,
        path: newPath
      }
    }
  } catch (error) {
    console.error('Ошибка переименования файла:', error)
    alert('Ошибка переименования файла: ' + error.message)
  }
}

const moveFile = (file) => {
  // Только администраторы могут перемещать файлы
  if (!isAdmin.value) {
    alert('У вас нет прав для перемещения файлов')
    return
  }
  
  hideContextMenu();
  openMoveModal(file);
};

// Вместо onMounted используем watcher на user
watch(user, (newUser) => {
  if (newUser && newUser.dropboxRefreshToken) {
    isDropboxAuthenticated.value = true;
    storageType.value = 'dropbox';
    // watcher на isDropboxAuthenticated вызовет загрузку данных
  } else {
    storageType.value = 'local';
  }
  
  // При изменении статуса авторизации загружаем все данные
  if (newUser && newUser.dropboxRefreshToken) {
    console.log('Загружаем все данные из Dropbox...');
    loadAllDropboxData();
  }
}, { immediate: true });

// onMounted теперь не занимается инициализацией Dropbox
onMounted(() => {
  document.addEventListener('click', closeAllModals);
  document.addEventListener('click', () => {
    hideContextMenu()
    hideFolderContextMenu()
    hideEmptySpaceContextMenu()
  })

  window.addEventListener('fileSaved', async (event) => {
    const { fileName, fileData } = event.detail;
    if (isDropboxAuthenticated.value && storageType.value === 'dropbox') {
      try {
        await saveToDropbox(fileName, fileData.data);
      } catch (error) {
        console.error('Ошибка сохранения в Dropbox:', error);
        alert('Ошибка сохранения в Dropbox: ' + error.message);
        saveFileLocally(fileName, fileData);
      }
    } else {
      saveFileLocally(fileName, fileData);
    }
  })

  // Загрузка данных при монтировании компонента
  if (isDropboxAuthenticated.value) {
    console.log('Загружаем все данные из Dropbox при монтировании...');
    try {
      // Сначала пробуем загрузить все данные сразу
      loadAllDropboxData();
    } catch (e) {
      console.error('Ошибка загрузки всех данных, пробуем последовательно:', e);
      // Если не получилось, загружаем последовательно
      loadDropboxData();
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('click', closeAllModals);
})

watch(files, (newFiles) => {
    // Сохраняем только локальные файлы в localStorage
    const localFiles = Array.isArray(newFiles) ? newFiles.filter(file => file.type !== 'cloud') : [];
    const toSave = localFiles.map(({ file, ...rest }) => rest);
    localStorage.setItem('excelFiles', JSON.stringify(toSave));
}, { deep: true });

// Функция для сохранения папки
const saveFolder = async () => {
  if (!editFolderName.value.trim()) {
    alert('Введите название папки')
    return
  }
  
  // Разрешаем любые буквы, убираем только запрещённые символы Dropbox
  const safeName = editFolderName.value.trim().replace(/[\\/:?"<>|*]/g, '').replace(/\s+/g, '_')
  const path = `/${safeName}`
  
  try {
    await dropboxStorage.createFolder(path)
    await loadDropboxFolders()
    closeEditFolderModal()
    alert('Папка успешно создана!')
  } catch (e) {
    alert('Ошибка создания папки: ' + e.message)
  }
}

// Функция для открытия модального окна редактирования папки
const openEditFolderModal = (folder) => {
  editingFolder.value = folder
  editFolderName.value = folder.name
  showEditFolderModal.value = true
}

// Функция для закрытия модального окна редактирования папки
const closeEditFolderModal = () => {
  showEditFolderModal.value = false
  editFolderName.value = ''
}

// Функция для получения фона папки
const getFolderBgColor = () => {
  return '#FEF9E7'; // стандартный фон для всех папок
}

// Функция для получения цвета контура папки
const getFolderStrokeColor = () => {
  return '#F59E0B'; // стандартный цвет контура для всех папок
}

// Функция для получения цвета при наведении на папку
const getFolderHoverBgColor = () => {
  return '#FDE68A'; // стандартный цвет при наведении для всех папок
}

// ...остальной код...

const hoveredFolderId = ref(null);


const hideFolderContextMenu = () => {
  folderContextMenu.value.show = false
}

const renameFolder = async (folder) => {
  // Только администраторы могут переименовывать папки
  if (!isAdmin.value) {
    alert('У вас нет прав для переименования папок')
    return
  }
  
  hideFolderContextMenu()
  const newName = prompt('Введите новое имя папки:', folder.name)
  if (!newName || newName === folder.name) return
  
  try {
    // Разрешаем любые буквы, убираем только запрещённые символы Dropbox
    const safeName = newName.trim().replace(/[\\/:?"<>|*]/g, '').replace(/\s+/g, '_')
    const newPath = `/${safeName}`
    
    // Создаем новую папку с новым именем
    await dropboxStorage.createFolder(newPath)
    
    // Перемещаем все файлы из старой папки в новую
    const filesInFolder = (Array.isArray(files.value) ? files.value : []).filter(f => f.path.startsWith(folder.path + '/'))
    for (const file of filesInFolder) {
      const newFilePath = file.path.replace(folder.path, newPath)
      await dropboxStorage.moveFile(file.path, newFilePath)
    }
    
    // Удаляем старую папку
    await dropboxStorage.deleteFolder(folder.path)
    
    // Обновляем списки
    await loadDropboxFolders()
    await loadDropboxFiles()
    
  } catch (error) {
    console.error('Ошибка переименования папки:', error)
    alert('Ошибка переименования папки: ' + error.message)
  }
}

const moveFolder = (folder) => {
  // Только администраторы могут перемещать папки
  if (!isAdmin.value) {
    alert('У вас нет прав для перемещения папок')
    return
  }
  
  hideFolderContextMenu()
  // Показываем модальное окно перемещения папки
  openMoveFolderModal(folder)
}

const openMoveFolderModal = (folder) => {
  folderToMove.value = folder
  showMoveFolderModal.value = true
}

const closeMoveFolderModal = () => {
  showMoveFolderModal.value = false
  folderToMove.value = null
}

const handleMoveFolderToFolder = async (targetFolder) => {
  if (!folderToMove.value) return
  
  try {
    const folder = folderToMove.value
    const oldFolderId = folder.id
    const newPath = targetFolder.path ? `${targetFolder.path}/${folder.name}` : `/${folder.name}`
    
    // Создаем новую папку в целевой папке
    await dropboxStorage.createFolder(newPath)
    
    // Перемещаем все файлы из старой папки в новую параллельно
    const filesInFolder = (Array.isArray(files.value) ? files.value : []).filter(f => f.path.startsWith(folder.path + '/'))
    const movePromises = filesInFolder.map(async (file) => {
      const newFilePath = file.path.replace(folder.path, newPath)
      return await dropboxStorage.moveFile(file.path, newFilePath)
    })
    
    await Promise.all(movePromises)
    
    // Удаляем старую папку
    await dropboxStorage.deleteFolder(folder.path)
    
    // Обновляем списки
    await Promise.all([loadDropboxFolders(), loadDropboxFiles()])
    
    // Переносим цвет папки
    const newFolder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.path === newPath)
    if (newFolder) {
      const savedColors = JSON.parse(localStorage.getItem('folderColors') || '{}')
      if (savedColors[oldFolderId]) {
        savedColors[newFolder.id] = savedColors[oldFolderId]
        delete savedColors[oldFolderId]
        localStorage.setItem('folderColors', JSON.stringify(savedColors))
      }
    }
    
    // Если мы находимся в перемещенной папке, переходим в корневую
    if (currentFolder.value === folder.id) {
      currentFolder.value = 'root'
    }
    
    closeMoveFolderModal()
    
    alert('Папка успешно перемещена!')
  } catch (error) {
    console.error('Ошибка перемещения папки:', error)
    alert('Ошибка перемещения папки: ' + error.message)
  }
}

const deleteFolderFromContext = async (folder) => {
  // Только администраторы могут удалять папки
  if (!isAdmin.value) {
    alert('У вас нет прав для удаления папок')
    return
  }
  
  hideFolderContextMenu()
  if (folder.id === 'root') return
  
  if (!confirm(`Удалить папку "${folder.name}" и все файлы в ней?`)) return
  
  try {
    await dropboxStorage.deleteFolder(folder.path)
    await loadDropboxFolders()
    if (currentFolder.value === folder.id) currentFolder.value = 'root'
    await loadDropboxFiles()
  } catch (error) {
    console.error('Ошибка удаления папки:', error)
    alert('Ошибка удаления папки: ' + error.message)
  }
}

const handleFolderDragStart = (event, folder) => {
  event.dataTransfer.setData('text/plain', JSON.stringify({
    type: 'folder',
    id: folder.id,
    name: folder.name,
    path: folder.path
  }))
  event.dataTransfer.effectAllowed = 'move'
}

const handleFolderDrop = async (event, targetFolder) => {
  event.preventDefault()
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    
    if (data.type === 'folder') {
      const sourceFolder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === data.id)
      if (!sourceFolder || sourceFolder.id === targetFolder.id || sourceFolder.id === 'root') return
      
      // Проверяем, что не пытаемся переместить папку в саму себя или в её подпапку
      if (targetFolder.path && targetFolder.path.startsWith(sourceFolder.path)) {
        alert('Нельзя переместить папку в её подпапку')
        return
      }
      
      const oldFolderId = sourceFolder.id
      const newPath = targetFolder.path ? `${targetFolder.path}/${sourceFolder.name}` : `/${sourceFolder.name}`
      
      // Создаем новую папку в целевой папке
      await dropboxStorage.createFolder(newPath)
      
      // Перемещаем все файлы из старой папки в новую
      const filesInFolder = (Array.isArray(files.value) ? files.value : []).filter(f => f.path.startsWith(sourceFolder.path + '/'))
      for (const file of filesInFolder) {
        const newFilePath = file.path.replace(sourceFolder.path, newPath)
        await dropboxStorage.moveFile(file.path, newFilePath)
      }
      
      // Удаляем старую папку
      await dropboxStorage.deleteFolder(sourceFolder.path)
      
      // Обновляем списки
      await loadDropboxFolders()
      await loadDropboxFiles()
      
      // Переносим цвет папки
      const newFolder = folders.value.find(f => f.path === newPath)
      if (newFolder) {
        const savedColors = JSON.parse(localStorage.getItem('folderColors') || '{}')
        if (savedColors[oldFolderId]) {
          savedColors[newFolder.id] = savedColors[oldFolderId]
          delete savedColors[oldFolderId]
          localStorage.setItem('folderColors', JSON.stringify(savedColors))
        }
      }
      
      // Если мы находимся в перемещенной папке, переходим в корневую
      if (currentFolder.value === sourceFolder.id) {
        currentFolder.value = 'root'
      }
      
    }
  } catch (error) {
    console.error('Ошибка перемещения папки:', error)
    alert('Ошибка перемещения папки: ' + error.message)
  }
}

const handleRootDrop = async (event) => {
  event.preventDefault()
  
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    
    if (data.type === 'folder' && currentFolder.value === 'root') {
      const sourceFolder = (Array.isArray(folders.value) ? folders.value : []).find(f => f.id === data.id)
      if (!sourceFolder || sourceFolder.id === 'root') return
      
      const oldFolderId = sourceFolder.id
      const newPath = `/${sourceFolder.name}`
      
      // Создаем новую папку в корне
      await dropboxStorage.createFolder(newPath)
      
      // Перемещаем все файлы из старой папки в новую
      const filesInFolder = (Array.isArray(files.value) ? files.value : []).filter(f => f.path.startsWith(sourceFolder.path + '/'))
      for (const file of filesInFolder) {
        const newFilePath = file.path.replace(sourceFolder.path, newPath)
        await dropboxStorage.moveFile(file.path, newFilePath)
      }
      
      // Удаляем старую папку
      await dropboxStorage.deleteFolder(sourceFolder.path)
      
      // Обновляем списки
      await loadDropboxFolders()
      await loadDropboxFiles()
      
      // Переносим цвет папки
      const newFolder = folders.value.find(f => f.path === newPath)
      if (newFolder) {
        const savedColors = JSON.parse(localStorage.getItem('folderColors') || '{}')
        if (savedColors[oldFolderId]) {
          savedColors[newFolder.id] = savedColors[oldFolderId]
          delete savedColors[oldFolderId]
          localStorage.setItem('folderColors', JSON.stringify(savedColors))
        }
      }
    }
  } catch (error) {
    console.error('Ошибка перемещения папки в корень:', error)
    alert('Ошибка перемещения папки: ' + error.message)
  }
}

// Функция для определения цвета текста для счетчика файлов
const getTextColorForBackground = () => {
  // Всегда возвращаем белый цвет для текста
  return '#ffffff'
}

const createFolderFromContext = () => {
  hideEmptySpaceContextMenu()
  showCreateFolderModal.value = true
  newFolderName.value = ''
}

const handleLogout = async () => {
  await logout()
  emit('logout')
}

// Функции для мобильного меню
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleGoToAdmin = () => {
  
  emit('goToAdmin')
}

// Добавляем watcher для автоматической загрузки данных Dropbox после авторизации
watch(isDropboxAuthenticated, async (newVal) => {
  if (newVal) {
    console.log('Загружаем все данные из Dropbox после авторизации...');
    try {
      // Сначала пробуем загрузить все данные сразу
      await loadAllDropboxData();
    } catch (e) {
      console.error('Ошибка загрузки всех данных, пробуем последовательно:', e);
      // Если не получилось, загружаем последовательно
      await loadDropboxData();
    }
  }
});





// Кэш для количества файлов и папок в каждой папке
const countsByFolderId = ref({});
const loadingCounts = ref({});

async function fetchItemCountForFolder(folder) {
  if (countsByFolderId.value[folder.id] !== undefined || loadingCounts.value[folder.id]) return;
  loadingCounts.value[folder.id] = true;
  try {
    const userToken = localStorage.getItem('user_token');
    // Получаем папки внутри
    const respFolders = await fetch(`/.netlify/functions/dropbox-folders?path=${encodeURIComponent(folder.path)}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const folders = await respFolders.json();
    // Получаем файлы внутри
    const respFiles = await fetch(`/.netlify/functions/dropbox?path=${encodeURIComponent(folder.path)}`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const files = await respFiles.json();
    countsByFolderId.value[folder.id] = folders.length + files.length;
  } catch (e) {
    countsByFolderId.value[folder.id] = 0;
  } finally {
    loadingCounts.value[folder.id] = false;
  }
}

watch([isDropboxAuthenticated, folders], ([auth, flds]) => {
  if (auth && Array.isArray(flds) && flds.length > 0) {
    // Для каждой папки сразу подгружаем количество файлов и папок
    flds.forEach(folder => {
      fetchItemCountForFolder(folder);
    });
  }
});

// Сохраняем режим отображения в localStorage
watch(viewMode, (newMode) => {
  localStorage.setItem('fileViewMode', newMode);
});

function goBack() {
  const folder = folders.value.find(f => f.id === currentFolder.value)
  if (!folder || !folder.path) {
    currentFolder.value = 'root'
    return
  }
  const parentPath = folder.path.substring(0, folder.path.lastIndexOf('/'))
  const parent = folders.value.find(f => f.path === parentPath)
  if (parent) {
    currentFolder.value = parent.id
  } else {
    currentFolder.value = 'root'
  }
}

// Состояние для контекстного меню файлов (если используется)
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  file: null
});

</script>

<style scoped>
/* Мобильное меню */
.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.mobile-menu-btn:hover {
  background: #f9fafb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mobile-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-close-btn {
  display: none;
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  transition: background-color 0.2s;
}

.mobile-close-btn:hover {
  background: #f3f4f6;
}

/* Main layout */
.file-manager {
    position: static;
    display: flex;
    height: 100vh;
    background: #f9fafb;
    justify-content: flex-start;
    align-items: stretch;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    overflow-x: hidden;
}

/* Sidebar */
.sidebar {
    width: 240px;
    min-width: 200px;
    height: 100vh;
    overflow-y: auto; /* разрешаем скроллинг */
    overflow-x: hidden;
    flex-shrink: 0;
    background: #fff;
    border-radius: 0;
    box-shadow: none;
    border: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    padding: 16px;
    margin-right: 0;
    z-index: 1;
    box-sizing: border-box;
    position: fixed; /* Фиксируем боковую панель */
    left: 0;
    top: 0;
}
.logo-container {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    margin-bottom: 24px;
}
.folder-tree {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    box-sizing: border-box;
}
.folder-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    transition: background-color 0.2s;
}
.folder-item--child {
    padding-left: 32px;
    margin-left: 8px;
    border-left: 2px solid #e5e7eb;
}
.folder-item:hover {
    background-color: var(--folder-color, #FEF3C7);
    border-left: 3px solid var(--folder-color, #FEF3C7);
    opacity: 0.3; /* делаем фон более бледным */
    overflow: hidden !important; /* скрываем скроллбары при наведении */
}
.folder-item.active {
    background-color: #eef2ff;
    color: #4f46e5;
}
.folder-item svg {
    width: 20px;
    height: 20px;
}

.folder-item-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.folder-color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.folder-color-dot .file-count {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    font-size: 8px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.folder-item:hover .folder-color-dot .file-count {
    opacity: 1;
}

  .sidebar-footer {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
    /* Обеспечиваем видимость footer на мобильных устройствах */
    position: sticky;
    bottom: 0;
    background: #fff;
    padding-bottom: env(safe-area-inset-bottom, 20px);
    width: 100%;
    box-sizing: border-box;
  }

.settings-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: none;
    border: none;
    border-radius: 6px;
    color: #374151;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.settings-btn:hover {
    background-color: #f3f4f6;
}

.storage-info {
    margin-top: 16px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.storage-text {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
}

.storage-separator {
    color: #9ca3af;
    font-weight: normal;
}

.storage-bar {
    width: 100%;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
}

.storage-used {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
    transition: width 0.3s ease;
}

.storage-label {
    font-size: 12px;
    color: #6b7280;
    text-align: center;
    font-weight: 500;
}

/* Main content */
.main-content {
    flex: 1;
    min-width: 320px;
    height: 100vh;           /* Добавлено */
    max-width: 100vw;
    background: #fff;
    border-radius: 0;
    box-shadow: none;
    border: none;
    margin: 0 0 0 240px; /* Добавляем отступ слева равный ширине sidebar */
    padding: 24px;
    display: flex;
    flex-direction: column;
    z-index: 1;
    overflow-y: auto !important;
    overflow-x: hidden;
}
.main-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}
.header-title {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
}
.header-actions {
    display: flex;
    gap: 12px;
}
.btn {
    height: 38px;
    padding: 0 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}
.upload-btn {
    background-color: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
}
.new-file-btn {
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
}

/* File container */
.file-container {
    padding-bottom: 32px;
    min-height: 300px;
    overflow: visible;
}

/* Grid view */
.tile-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 20px;
    align-content: flex-start;
    vertical-align: top;
    justify-content: flex-start;
}

/* List view */
.list-view {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto !important; /* Разрешаем вертикальную прокрутку */
    max-height: calc(100vh - 200px); /* Ограничиваем высоту для появления скролла */
}

/* Стилизуем скроллбары в режиме списка вместо их скрытия */


.list-view::-webkit-scrollbar {
    width: 8px; /* Ширина скроллбара */
    height: 8px;
}

.list-view .tile {
    width: 100%;
    height: auto;
    min-height: 60px;
    display: grid;
    grid-template-columns: 40px 1fr auto;
    align-items: center;
    padding: 12px 16px;
    gap: 16px;
    overflow: hidden !important;
    box-sizing: border-box;
    border-radius: 8px;
}

.list-view .tile-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 0;
}

.list-view .tile-icon svg {
    width: 24px;
    height: 24px;
}

.list-view .tile-name {
    font-size: 15px;
    text-align: left;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.list-view .tile-details {
    display: flex;
    gap: 16px;
    color: #6b7280;
    font-size: 13px;
    min-width: 200px;
    justify-content: flex-end;
}

.list-view .tile-date {
    white-space: nowrap;
}

.list-view .tile-size {
    white-space: nowrap;
    min-width: 70px;
    text-align: right;
}
.tile {
    width: 140px;
    min-width: 140px;
    
    height: 200px;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    transition: all 0.2s;
    cursor: pointer;
    overflow: hidden;
    padding: 24px 8px 12px 8px;
    box-sizing: border-box;
}
.tile:hover {
    border-color: #6ee7b7;
    box-shadow: 0 4px 6px -1px rgba(16,185,129,0.10), 0 2px 4px -2px rgba(16,185,129,0.10);
    background: #fff;
}
.tile-icon {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 85px;
    height: 85px;
}
.tile-icon svg {
    width: 64px;
    height: 64px;
}
.tile-name {
    font-size: 15px;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}
.tile-grid .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #6b7280;
}
.tile-grid .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
.tile-grid .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: #6b7280;
    min-height: 320px;
    width: auto;
    max-width: 400px;
    margin: 0 auto;
}
.tile-grid .empty-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
    color: #d1d5db;
}
.tile-grid .empty-state h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}
.tile-grid .empty-state p {
    margin: 0 0 16px 0;
    color: #6b7280;
}
.tile-grid .empty-state p:last-child {
    margin-bottom: 0;
}
.tile-grid .empty-state button {
    background-color: #4f46e5;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}
.tile-grid .empty-state button:hover {
    background-color: #635fc7;
}
.tile-grid .tile-icon--folder {
    color: #b45309;
    border-radius: 12px;
    box-shadow: none;
    border: none !important;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    /* background-color теперь управляется через inline стили */
}

.tile-grid .tile-icon--folder .file-count {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.tile-grid .tile--folder:hover .file-count {
    opacity: 1;
}

.file-count {
    font-size: 10px;
    font-weight: bold;
    color: white;
    text-align: center;
    line-height: 1;
}

.tile-grid .tile-icon--table {
    background-color: #d1fae5 !important;
    color: #15803d;
    border-radius: 12px;
    box-shadow: none;
    border: none !important;
}
.tile-grid .tile-details {
    flex: 1 1 0%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.tile-grid .tile-date {
    font-size: 12px;
    color: #6b7280;
}
.tile-grid .tile-source {
    font-size: 10px;
    color: #0061FE;
    background: #e3f2fd;
    padding: 2px 6px;
    border-radius: 3px;
    margin-top: 2px;
    display: inline-block;
}
.tile-grid .tile-actions {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: 4px;
    margin-left: 8px;
    align-items: flex-end;
    justify-content: center;
    height: 100%;
}
.tile-grid .tile-action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background-color: transparent;
    color: #9ca3af;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-sizing: border-box;
}
.tile-grid .tile-action-btn:hover {
    background-color: #f3f4f6;
    color: #374151;
}
.tile-grid .is-favorite {
    color: #f59e0b;
}

/* Drag overlay */
.drag-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(79, 70, 229, 0.1) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: 2px dashed #4f46e5;
    z-index: 9999;
}
.drag-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #4f46e5;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: #6b7280;
}

.close-btn:hover {
    background-color: #f3f4f6;
}

.modal-body {
  padding: 24px;
  background: white;
  border-radius: 0 0 12px 12px;
}

.storage-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}

.tab-btn {
    background: none;
    border: none;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn.active {
    border-bottom: 2px solid #4f46e5;
}

.storage-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.google-drive-placeholder {
    text-align: center;
    padding: 24px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.google-drive-placeholder h3 {
    margin: 0 0 12px 0;
    color: #111827;
}

.google-drive-placeholder p {
    margin: 0 0 16px 0;
    color: #6b7280;
}

.search-and-view-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 0 0 32px 0;
}

.search-bar {
    flex: 1;
    max-width: 500px;
    padding: 0 0 0 8px;
    background: none;
    border-radius: 0;
    box-shadow: none;
}

.search-bar input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f3f4f6;
    color: #222;
    font-size: 15px;
    outline: none;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-bottom: 0;
}

.search-bar input:focus {
    border-color: #4f46e5;
    background: #fff;
    box-shadow: 0 2px 8px rgba(79,70,229,0.08);
    outline: none;
}

.view-mode-controls {
    display: flex;
    gap: 8px;
}

.view-mode-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
}

.view-mode-btn:hover {
    background: #f3f4f6;
    color: #374151;
}

.view-mode-btn.active {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
}

.breadcrumb {
    margin-bottom: 24px;
    background: none;
    border-radius: 0;
    padding: 0;
    box-shadow: none;
    display: block;
}
.breadcrumb-link {
    cursor: pointer;
    color: #4f46e5;
    font-weight: normal;
    transition: none;
}
.breadcrumb-link:hover {
    color: #3730a3;
    text-decoration: underline;
}
.breadcrumb-sep {
    margin: 0 8px;
}
.styled-add-folder {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px;
    background: #4f46e5;
    color: #fff;
    border: none;
    cursor: pointer;
    transition: background 0.2s;
}
.styled-add-folder:hover {
    background: #3730a3;
}
.styled-add-folder svg {
    display: block;
    margin: 0;
    padding: 0;
}
.styled-add-folder span {
    display: block;
    margin: 0;
    padding: 0;
}
.delete-folder-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: #6b7280;
}
.delete-folder-btn:hover {
    background-color: #f3f4f6;
}
@media (max-width: 900px) {
    .file-manager {
        flex-direction: column;
        align-items: stretch;
        justify-content: flex-start;
    }
    .sidebar {
        margin: 0;
        width: 100vw;
        min-width: unset;
        border-radius: 0;
        padding: 12px 4px;
    }
    .main-content {
        margin: 0;
        width: 100vw;
        max-width: 100vw;
        border-radius: 0;
        padding: 12px 4px;
    }
}

/* Используем стандартный скроллбар браузера */

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  z-index: 10000;
  min-width: 160px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
  transition: background-color 0.2s;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item--danger {
  color: #dc2626;
}

.context-menu-item--danger:hover {
  background-color: #fef2f2;
}

.context-menu-item svg {
  flex-shrink: 0;
}

.move-modal {
  padding: 24px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.file-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 8px;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.file-path {
  font-size: 14px;
  color: #6b7280;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.folder-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.folder-card {
  width: calc(33.33% - 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.folder-card:hover {
  transform: translateY(-4px);
}

.folder-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 8px;
  position: relative;
}

.folder-color-circle-modal {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.folder-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-top: 8px;
}

.folder-path {
  font-size: 12px;
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.folder-color-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

/* Стили для модального окна создания папки */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input[type="color"] {
  width: 60px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Стили для цветового пикера */
.color-picker-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.color-preview {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: border-color 0.2s;
}

.color-preview:hover {
  border-color: #3b82f6;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  opacity: 0;
  position: absolute;
  pointer-events: none;
}

.color-presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #e5e7eb;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
  border-color: #3b82f6;
}

/* Стили для предварительного просмотра */
.folder-preview {
  margin: 20px 0;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.preview-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.preview-folder {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.preview-folder .folder-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.preview-folder .folder-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.preview-folder svg {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.preview-folder span {
  font-size: 14px;
  color: #374151;
}

.edit-modal {
  padding: 24px;
}

.edit-modal .form-group {
  margin-bottom: 20px;
}

.edit-modal .form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.edit-modal .form-group input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.edit-modal .form-group input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.edit-modal .form-group input[type="color"] {
  width: 60px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}

.edit-modal .btn-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.edit-modal .btn-primary:hover {
  background-color: #2563eb;
}

.edit-modal .btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.tile-grid .tile--folder:hover {
    border-color: var(--folder-border-color, #FEF3C7);
    box-shadow: 0 4px 6px -1px rgba(254, 243, 199, 0.10), 0 2px 4px -2px rgba(254, 243, 199, 0.10);
    background: #fff;
}

.tile-grid .tile--folder:hover .tile-icon--folder {
    /* background-color теперь управляется через inline стили */
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background-color: #f0f0f0;
}

.folder-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 10px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.folder-item:last-child {
  border-bottom: none;
}

.folder-item:hover {
  background-color: #f8f9fa;
}

.folder-item .folder-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  position: relative;
}

.folder-item .folder-color-circle {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid white;
}

.folder-item span {
  font-size: 14px;
  color: #333;
}

.modal-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 16px;
}

.folder-item--root {
  background-color: #f3f4f6;
  border-left: 3px solid #4f46e5;
}

.folder-icon--root {
  background-color: #4f46e5;
}

.modal--move-folder {
  max-width: 500px;
  width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.modal--move-folder .modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
  border-bottom: none;
}

.modal--move-folder .modal-header h3 {
  color: white;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal--move-folder .modal-close {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  transition: background-color 0.2s;
}

.modal--move-folder .modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal--move-folder .modal-body {
  padding: 24px;
  background: white;
  border-radius: 0 0 12px 12px;
}

.folder-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-top: 10px;
  background: #fafafa;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.folder-item:last-child {
  border-bottom: none;
}

.folder-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  transform: translateX(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.folder-item--root {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-left: 4px solid #4f46e5;
  font-weight: 600;
}

.folder-item--root:hover {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
}

.folder-item .folder-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.folder-icon--root {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
  color: white;
}

.folder-item .folder-color-circle {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.folder-item span {
  font-size: 15px;
  color: #374151;
  font-weight: 500;
}

.folder-item--root span {
  color: #1f2937;
}

.folder-item--root span {
  color: #1f2937;
}

.modal--create-folder {
  max-width: 450px;
  width: 90%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.modal--create-folder .modal-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
  border-bottom: none;
}

.modal--create-folder .modal-header h3 {
  color: white;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal--create-folder .modal-close {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  transition: background-color 0.2s;
}

.modal--create-folder .modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal--create-folder .modal-body {
  padding: 24px;
  background: white;
  border-radius: 0 0 12px 12px;
}

.file-count {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 10px;
  font-weight: bold;
  color: white;
  background-color: #3b82f6;
  padding: 2px 4px;
  border-radius: 50%;
}

.file-count.visible {
  opacity: 1;
}

.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.global-loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.global-loading-text {
  margin-top: 20px;
  font-size: 16px;
  color: #333;
}

.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.login-form {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  padding: 32px 28px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 280px;
  align-items: center;
}
.login-form h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  color: #222;
}
.login-form input {
  width: 200px;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
.login-form input:focus {
  border-color: #3b82f6;
}
.login-form button {
  width: 100%;
  padding: 10px 0;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.login-form button:hover {
  background: #2563eb;
}
.login-error {
  color: #ef4444;
  font-size: 14px;
  margin-top: 4px;
  text-align: center;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 8px;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.role-badge {
  background-color: #4f46e5;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.sidebar-btn {
  width: 100%;
  background: none;
  border: none;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 16px;
  box-sizing: border-box;
}

.sidebar-btn:hover {
  color: #4f46e5;
}

.sidebar-btn svg {
  width: 18px;
  height: 18px;
}

.admin-panel-link {
  background-color: #4f46e5;
  color: white;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 12px;
}

.admin-panel-link:hover {
  background-color: #3730a3;
}

.admin-panel-link svg {
  width: 18px;
  height: 18px;
}

.settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.settings-btn:hover {
  background-color: #f3f4f6;
}

.settings-btn svg {
  width: 18px;
  height: 18px;
}

.settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.settings-btn:hover {
  background-color: #f3f4f6;
}

.settings-btn svg {
  width: 18px;
  height: 18px;
}

/* ... существующие стили ... */
.modal-overlay[style*="display: block"] {
  outline: 4px solid red !important;
  z-index: 99999 !important;
}

.main-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  margin-right: 8px;
}
.back-btn:hover {
  background: #f3f4f6;
}

.logo-svg {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Медиа-запросы для мобильных устройств */
@media (max-width: 768px) {
  .mobile-menu-btn {
    display: block;
  }
  
  .mobile-overlay {
    display: block;
    /* Учитываем безопасные зоны для мобильных браузеров */
    padding-bottom: env(safe-area-inset-bottom, 0);
  }
  
  .mobile-close-btn {
    display: block;
  }
  
  .sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: -280px;
    width: 280px;
    height: 100vh;
    z-index: 1000;
    transition: left 0.3s ease;
    border-radius: 0;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    padding-bottom: calc(env(safe-area-inset-bottom, 20px) + 20px);
    background: #fff;
  }
  
  .sidebar--mobile-open {
    left: 0;
    overflow: hidden;
  }
  
  .folder-tree {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    margin-bottom: 8px;
  }
  
  .sidebar-footer {
    flex: 0 0 auto;
    position: sticky;
    bottom: 0;
    background: #fff;
    padding-bottom: env(safe-area-inset-bottom, 20px);
    z-index: 2;
  }
  
  .main-content {
    margin-left: 0;
    padding: 16px;
  }
  
  .main-header {
    margin-top: 60px;
  }
  
  .tile-grid {
    gap: 12px;
  }
  
  .tile {
    width: calc(50% - 6px);
    min-width: 120px;
    height: 140px;
    padding: 16px 8px 12px 8px;
  }
  
  .tile-icon {
    width: 60px;
    height: 60px;
  }
  
  .tile-name {
    font-size: 12px;
  }
  
  .search-bar {
    margin-bottom: 16px;
  }
  
  .search-bar input {
    font-size: 14px;
    padding: 8px 12px;
  }
  
  .breadcrumb {
    margin-bottom: 16px;
    font-size: 12px;
  }
  
  .header-title {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .tile {
    width: calc(50% - 6px);
    min-width: 100px;
    height: 120px;
    padding: 12px 6px 8px 6px;
  }
  
  .tile-icon {
    width: 50px;
    height: 50px;
  }
  
  .tile-name {
    font-size: 11px;
  }
  
  .main-content {
    padding: 12px;
  }
  
  .main-header {
    margin-top: 50px;
  }
  
  .header-title {
    font-size: 18px;
  }
  
  .list-view .tile-details {
    display: none;
  }
  
  .search-and-view-controls {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .search-bar {
    width: 100%;
    max-width: none;
  }
  
  .view-mode-controls {
    align-self: flex-end;
  }
}
</style> 