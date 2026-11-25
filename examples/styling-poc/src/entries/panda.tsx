import '@monoline/css/core.css';
import {styles} from '../panda/styles';
import '../panda/panda.css';
import '../app.css';
import {Demo} from '../demo';
import {mount} from '../mount';

mount(<Demo styles={styles} label="Panda CSS" />);
