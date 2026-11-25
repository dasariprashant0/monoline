import '@monoline/css/core.css';
import {styles as modules} from '../modules/styles';
import {styles as plain} from '../plain/styles';
import '../app.css';
import {Demo} from '../demo';
import {mount} from '../mount';

mount(
  <>
    <Demo styles={plain} label="Plain CSS" />
    <Demo styles={modules} label="CSS Modules" />
  </>,
);
