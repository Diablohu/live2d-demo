import { StrictMode } from 'react';
import { extend } from 'koot';

import Live2dDemo from './live2d-demo';

import styles from './app.module.less';

// ============================================================================

const App = extend({
    styles,
})(({ className, children, location, ...props }) => (
    <StrictMode>
        <Live2dDemo />
    </StrictMode>
));
export default App;
