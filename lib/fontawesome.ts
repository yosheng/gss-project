import { library, config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

config.autoAddCss = false;
import { 
  faLock, 
  faUser, 
  faEye, 
  faEyeSlash,
  faSearch,
  faFilter,
  faDownload,
  faEdit,
  faTrash,
  faPlus,
  faSignOutAlt,
  faHome,
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faLock, 
  faUser, 
  faEye, 
  faEyeSlash,
  faSearch,
  faFilter,
  faDownload,
  faEdit,
  faTrash,
  faPlus,
  faSignOutAlt,
  faHome
);