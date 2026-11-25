import '@monoline/css/core.css';
import {styles} from '../ve/styles';
import '../app.css';
import {Demo} from '../demo';
import {mount} from '../mount';

mount(<Demo styles={styles} label="Vanilla Extract" />);
