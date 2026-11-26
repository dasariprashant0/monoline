import '@monoline/css/core.css';
import {styles as modules} from '../modules/styles';
import {styles as panda} from '../panda/styles';
import {styles as plain} from '../plain/styles';
import {styles as ve} from '../ve/styles';
import '../panda/panda.css';
import '../app.css';
import {Demo} from '../demo';
import {mount} from '../mount';

mount(
  <>
    <Demo styles={plain} label="Plain CSS" />
    <Demo styles={modules} label="CSS Modules" />
    <Demo styles={ve} label="Vanilla Extract" />
    <Demo styles={panda} label="Panda CSS" />
  </>,
);
