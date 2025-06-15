import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      mapViewDashboard: 'MapView Dashboard',
      locationAnalytics: 'Location Analytics',
      interactiveMapDescription: 'Interactive map with data table visualization',
      quickStats: 'Quick Stats',
      totalLocations: 'Total Locations',
      activeUsers: 'Active Users',
      growthRate: 'Growth Rate',
      mapControls: 'Map Controls',
      filterByRegion: 'Filter by Region',
      exportData: 'Export Data',
      shareMap: 'Share Map',
      copyLinkDescription: 'Copy the link below to share the map:',
      cancel: 'Cancel',
      copyLink: 'Copy Link',
      location: 'Location',
      region: 'Region',
      coordinates: 'Coordinates',
      users: 'Users',
      status: 'Status',
      lastUpdated: 'Last Updated',
      actions: 'Actions',
      operationSuccess: 'Operation completed successfully',
      confirmDelete: 'Confirm Delete',
      areYouSure: 'Are you sure you want to delete this row?',
      delete: 'Delete',
      editLocation: 'Edit Location',
      save: 'Save',
      addLocation: '+ Add Location',
      close: 'Close',
      noResultsFound: 'No results found',
      all: 'All',
      layers: 'Layers',
      toggleLanguage: 'Toggle Language',
      test: 'Test', // مفتاح للاختبار
      LocationData:'Location Data',
      SearchLocations:'🔍 Search locations...',
      Showing:'Showing',
      results:'results',
      to:'to',
      of:'of',
      Next:'Next',
      Previous:'Previous',
      NoResultsFound:'No results found'

    },
  },
  ar: {
    translation: {
      mapViewDashboard: 'لوحة تحكم عرض الخريطة',
      locationAnalytics: 'تحليلات المواقع',
      interactiveMapDescription: 'خريطة تفاعلية مع تصور جدول البيانات',
      quickStats: 'إحصائيات سريعة',
      totalLocations: 'إجمالي المواقع',
      activeUsers: 'المستخدمون النشطون',
      growthRate: 'معدل النمو',
      mapControls: 'عناصر التحكم في الخريطة',
      filterByRegion: 'تصفية حسب المنطقة',
      exportData: 'تصدير البيانات',
      shareMap: 'مشاركة الخريطة',
      copyLinkDescription: 'انسخ الرابط أدناه لمشاركة الخريطة:',
      cancel: 'إلغاء',
      copyLink: 'نسخ الرابط',
      location: 'الموقع',
      region: 'المنطقة',
      coordinates: 'الإحداثيات',
      users: 'المستخدمين',
      status: 'الحالة',
      lastUpdated: 'آخر تحديث',
      actions: 'الإجراءات',
      operationSuccess: 'تم تنفيذ العملية بنجاح',
      confirmDelete: 'تأكيد الحذف',
      areYouSure: 'هل أنت متأكد أنك تريد حذف هذا السطر؟',
      delete: 'حذف',
      editLocation: 'تعديل الموقع',
      save: 'حفظ',
      addLocation: '  إضافة موقع + ',
      close: 'إغلاق',
      noResultsFound: 'لا توجد نتائج',
      all: 'الكل',
      layers: 'الطبقات',
      toggleLanguage: 'تبديل اللغة',
      test: 'اختبار', // مفتاح للاختبار
      LocationData:'بيانات الموقع',
      SearchLocations:' 🔍 البحث عن موقع ...',
      Showing:'عرض',
      results:'نتيجة',
      to:'الى',
      of:'من',
      Next:'التالي',
      Previous:'السابق',
      NoResultsFound:'لم يتم العثور على نتائج'


    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // لو فيه مشاكل مع Suspense
    },
  })
  .then(() => console.log('i18next initialized successfully'))
  .catch((err) => console.error('i18next initialization failed:', err));

export default i18n;