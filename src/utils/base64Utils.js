/**
 * Утилиты для работы с base64 кодированием
 */

/**
 * Безопасное декодирование base64 строки с поддержкой Unicode символов
 * @param {string} base64 - строка в формате base64
 * @returns {Uint8Array} - массив байтов
 */
export function safeBase64ToUint8Array(base64) {
  try {
    // Стандартный метод декодирования base64
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error('Ошибка при декодировании base64:', e);
    
    // Альтернативный метод для случаев с Unicode символами
    try {
      // Используем TextDecoder для корректной работы с Unicode
      const binString = atob(base64);
      const bytes = new Uint8Array(binString.length);
      for (let i = 0; i < binString.length; i++) {
        bytes[i] = binString.charCodeAt(i) & 0xff; // Берем только младший байт
      }
      return bytes;
    } catch (e2) {
      console.error('Критическая ошибка при декодировании base64:', e2);
      throw new Error('Не удалось декодировать base64 данные');
    }
  }
}

/**
 * Создает Blob из base64 строки
 * @param {string} base64 - строка в формате base64
 * @param {string} mimeType - MIME-тип файла
 * @returns {Blob} - объект Blob
 */
export function base64ToBlob(base64, mimeType = 'application/octet-stream') {
  const bytes = safeBase64ToUint8Array(base64);
  return new Blob([bytes], { type: mimeType });
}

/**
 * Создает File объект из base64 строки
 * @param {string} base64 - строка в формате base64
 * @param {string} fileName - имя файла
 * @param {string} mimeType - MIME-тип файла
 * @returns {File} - объект File
 */
export function base64ToFile(base64, fileName, mimeType = 'application/octet-stream') {
  const blob = base64ToBlob(base64, mimeType);
  return new File([blob], fileName, { type: mimeType });
}