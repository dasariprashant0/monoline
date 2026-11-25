import '@monoline/css/core.css';
import {styles} from '../plain/styles';
import '../app.css';
import {Demo} from '../demo';
import {mount} from '../mount';

mount(<Demo styles={styles} label="Plain CSS" />);
