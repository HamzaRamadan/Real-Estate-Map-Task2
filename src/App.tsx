import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import './i18n'; // استيراد إعدادات i18next
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n'; 
const App = () => {
  return (
    <>
    <I18nextProvider i18n={i18n}>

      <Navbar /> 
      <Dashboard /> 
    </I18nextProvider>
      
    </>
  );
};

export default App;
